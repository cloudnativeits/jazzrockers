import cron from 'node-cron';
import { db } from '../db.js';
import * as schema from '../../shared/schema.js';
import { and, eq, gte, lte, isNull, sql, or, like, lt, desc } from 'drizzle-orm';
import { format } from 'date-fns';
import { sendEmail } from '../email/emailNotification.js';
// import { generateInvoicePDF } from 'server/email/generateInvoicePDF.js';

async function generateCreditNotesForMissedClasses(year: number, month: number) {
    console.log('Starting end-of-month credit note generation...');
    const today = new Date();
    // const monthStr = today.toLocaleString('default', { month: 'long', year: 'numeric' });
    // const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    // const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const monthStr = monthStart.toLocaleString('default', { month: 'long', year: 'numeric' });

    try {
        const activeEnrollments = await db
            .select({
                enrollmentId: schema.enrollments.id,
                studentId: schema.enrollments.studentId,
                enrollmentDate: schema.enrollments.enrollmentDate,
                perDayValue: schema.batches.perDayValue,
                batchId: schema.batches.id,
                batchName: schema.batches.name,
            })
            .from(schema.enrollments)
            .innerJoin(schema.batches, eq(schema.enrollments.batchId, schema.batches.id))
            .where(eq(schema.enrollments.status, "active"));

        console.log(`Found ${activeEnrollments.length} active enrollments`);

        for (const enr of activeEnrollments) {
            const { studentId, perDayValue, batchId, batchName } = enr;

            const absentResult = await db
                .select({ count: sql<number>`count(*)` })
                .from(schema.attendance)
                .where(and(
                    eq(schema.attendance.studentId, studentId),
                    eq(schema.attendance.batchId, batchId),
                    gte(schema.attendance.date, monthStart.toISOString().split('T')[0]),
                    lte(schema.attendance.date, monthEnd.toISOString().split('T')[0]),
                    eq(schema.attendance.status, 'leave'),
                    isNull(schema.attendance.compensationDate)
                ));

            const missedCount = Number(absentResult[0]?.count || 0);

            const transportInfo = await db
                .select({
                    modeId: schema.transportation.modeId,
                    mode: schema.transportationMode.mode,
                    perDayValue: schema.transportationMode.perDayValue,
                })
                .from(schema.transportation)
                .innerJoin(
                    schema.transportationMode,
                    eq(schema.transportation.modeId, schema.transportationMode.id)
                )
                .where(and(
                    eq(schema.transportation.studentId, studentId),
                    eq(schema.transportation.transportationNeeded, true)
                ))
                .limit(1);

            let transportRefund = 0;
            let transportNote = '';
            if (transportInfo.length > 0) {
                const transportPerDay = Number(transportInfo[0].perDayValue || 0);
                transportRefund = missedCount * transportPerDay;
                transportNote = ` + Transportation: ${transportRefund.toFixed(2)}`;
            }

            if (missedCount === 0) {
                console.log(`No absents for student ${studentId} in batch ${batchId}, skipping credit note.`);
            } else {
                //   const existingCreditNotes = await db
                //     .select()
                //     .from(schema.creditNotes)
                //     .where(and(
                //       eq(schema.creditNotes.studentId, studentId),
                //       eq(schema.creditNotes.generatedMonth, monthStr),
                //       or(
                //         like(schema.creditNotes.reason, `Credit for ${missedCount} missed class(es) in ${monthStr} (Batch ${batchName} ${transportNote})`),
                //         like(schema.creditNotes.reason, `Credit for ${missedCount} missed class(es) in ${monthStr} (Batch ${batchName})`)
                //       )
                //     ));
                const existingCreditNotes = await db
                    .select()
                    .from(schema.creditNotes)
                    .where(and(
                        eq(schema.creditNotes.studentId, studentId),
                        eq(schema.creditNotes.generatedMonth, monthStr),
                        like(schema.creditNotes.reason, `Credit for%in ${monthStr} (Batch ${batchName}%`)
                    ));

                if (existingCreditNotes.length > 0) {
                    console.log(`Credit note for ${monthStr} already exists for student ${studentId} in batch ${batchName}, skipping.`);
                } else {
                    const perClassFee = Number(perDayValue);
                    const creditAmount = missedCount * perClassFee;

                    console.log(
                        `Student ${studentId} (Batch ${batchId}): ${missedCount} missed class(es) x AED ${perClassFee.toFixed(2)} = AED ${creditAmount.toFixed(2)}`
                    );

                    try {
                        const lastCreditNote = await db
                            .select()
                            .from(schema.creditNotes)
                            .orderBy(desc(schema.creditNotes.id))
                            .limit(1);

                        let nextNumber = 101;
                        if (lastCreditNote.length && lastCreditNote[0].creditNoteNumber) {
                            const lastNum = parseInt(
                                lastCreditNote[0].creditNoteNumber.replace("CN-", "")
                            );
                            if (!isNaN(lastNum)) {
                                nextNumber = lastNum + 1;
                            }
                        }

                        const totalAmount = creditAmount + transportRefund;
                        // const reason = `Credit of ${creditAmount.toFixed(2)} for ${missedCount} missed class${missedCount > 1 ? 'es' : ''} in ${monthStr} (Batch ${batchName})${transportNote}`;
                        // const reason = `${creditAmount.toFixed(2)} course fee credit${transportRefund > 0 ? transportNote : ''} for ${missedCount} missed class${missedCount > 1 ? 'es' : ''} in Batch ${batchName} for ${monthStr}`;
                        const reason = `Credit for ${missedCount} missed class${missedCount > 1 ? 'es' : ''} in ${monthStr} (Batch ${batchName}) - [Course Fee : ${creditAmount.toFixed(2)}${transportNote}]`;

                        const creditNoteNumber = `CN-${nextNumber}`;

                        await db.insert(schema.creditNotes).values({
                            creditNoteNumber,
                            studentId: sql`${studentId}`,
                            amount: totalAmount.toFixed(2),
                            generatedMonth: monthStr,
                            reason: reason,
                            status: 'open',
                            appliedInvoiceId: null,
                            appliedToType: null,
                        });

                        console.log(`Leave-based credit note of AED ${totalAmount.toFixed(2)} created for student ${studentId} in batch ${batchName}`);
                    } catch (insertError) {
                        console.error(`Failed to insert credit note for student ${studentId} in batch ${batchId}:`, insertError);
                    }
                }
            }
        }
        console.log('Finished credit note generation.');
    } catch (error) {
        console.error('CRITICAL ERROR during credit note generation:', error);
    }
}

async function generateMonthlyInvoices() {
    console.log('Starting monthly invoice generation...');
    const today = new Date();
    const invoiceMonthStr = today.toLocaleString('default', { month: 'long', year: 'numeric' });

    const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    try {
        const activeStudents = await db.select().from(schema.students).where(eq(schema.students.status, 'active'));

        for (const student of activeStudents) {
            const attendanceRecord = await db.select({ id: schema.attendance.id })
                .from(schema.attendance)
                .where(and(
                    eq(schema.attendance.studentId, student.id),
                    gte(schema.attendance.date, prevMonthStart.toISOString().split('T')[0]),
                    lte(schema.attendance.date, prevMonthEnd.toISOString().split('T')[0])
                )).limit(1);

            if (attendanceRecord.length === 0) {
                console.log(`Skipping invoice for student ${student.id}: No attendance last month.`);
                continue;
            }

            const existingInvoices = await db
                .select()
                .from(schema.invoices)
                .where(eq(schema.invoices.studentId, student.id));

            const isFirstInvoice = existingInvoices.length === 0;

            try {
                await db.transaction(async (tx) => {
                    const invoiceNumber = `INV-${format(new Date(), 'yyyyMMdd')}-${student.id}`;
                    const existingInvoice = await tx
                        .select()
                        .from(schema.invoices)
                        .where(and(
                            eq(schema.invoices.studentId, student.id),
                            eq(schema.invoices.invoiceNumber, invoiceNumber)
                        ))
                        .limit(1);

                    if (existingInvoice.length > 0) {
                        console.log(`Invoice already exists for student ${student.id} with invoiceNumber ${invoiceNumber}, skipping.`);
                        return;
                    }

                    const invoiceItemsData = [];
                    let subTotal = 0;
                    let totalDiscounts = 0;

                    // Registration Fee - only for first invoice
                    const registrationFee = Number(student.registrationFee);
                    if (isFirstInvoice && registrationFee > 0) {
                        subTotal += registrationFee;
                        invoiceItemsData.push({
                            description: 'Registration Fee',
                            itemType: 'registration_fee',
                            unitPrice: registrationFee.toFixed(2),
                            total: registrationFee.toFixed(2),
                        });
                    }

                    // Course Fee
                    const enrollments = await tx.select({
                        courseName: schema.courses.name,
                        originalFee: schema.courses.fee,
                        totalFee: schema.studentCourseFee.totalFee,
                        discountType: schema.studentCourseFee.discountType,
                        discountValue: schema.studentCourseFee.discountValue,
                        durationMonths: schema.studentCourseFee.durationMonths,
                        monthsOfYear: schema.studentCourseFee.monthsOfYear,
                    })
                        .from(schema.enrollments)
                        .innerJoin(schema.studentCourseFee, eq(schema.enrollments.id, schema.studentCourseFee.enrollmentId))
                        .innerJoin(schema.courses, eq(schema.enrollments.courseId, schema.courses.id))
                        .where(and(eq(schema.enrollments.studentId, student.id), eq(schema.enrollments.status, 'active')));

                    const existingInvoiceCounts: Record<string, number> = {};

                    const previousInvoices = await tx.select({
                        description: schema.invoiceItems.description,
                        itemType: schema.invoiceItems.itemType,
                    })
                        .from(schema.invoices)
                        .innerJoin(schema.invoiceItems, eq(schema.invoices.id, schema.invoiceItems.invoiceId))
                        .where(and(
                            eq(schema.invoices.studentId, student.id),
                            or(eq(schema.invoiceItems.itemType, 'course_fee'), eq(schema.invoiceItems.itemType, 'transport_fee'))
                        ));

                    for (const item of previousInvoices) {
                        let key = item.description;

                        if (item.itemType === 'transport_fee') {
                            // Normalize key for transport fee
                            key = `transport_${item.description.replace('Transportation - ', '')}`;
                        }

                        existingInvoiceCounts[key] = (existingInvoiceCounts[key] || 0) + 1;
                    }

                    for (const enr of enrollments) {
                        let monthlyFee = Number(enr.originalFee);
                        let discountAmount = 0;
                        let shownDiscountValue = 0;
                        const duration = Number(enr.durationMonths);

                        const existingInvoiceCount = existingInvoiceCounts[enr.courseName] || 0;
                        const shouldApplyDiscount = (isFirstInvoice || duration > 1) && existingInvoiceCount < duration;

                        if (monthlyFee > 0) {
                            if (shouldApplyDiscount) {
                                if (enr.discountType === 'percentage') {
                                    const splitPercentage = duration > 1
                                        ? Number(enr.discountValue) / duration
                                        : Number(enr.discountValue);
                                    discountAmount = (monthlyFee * splitPercentage) / 100;
                                    shownDiscountValue = splitPercentage;
                                } else if (enr.discountType === 'amount') {
                                    discountAmount = duration > 1
                                        ? Number(enr.discountValue) / duration
                                        : Number(enr.discountValue);
                                    shownDiscountValue = discountAmount;
                                }

                                totalDiscounts += discountAmount;
                            }

                            const lineTotal = monthlyFee - discountAmount;

                            invoiceItemsData.push({
                                description: `${enr.courseName}`,
                                itemType: 'course_fee',
                                discountType: `${enr.discountType}`,
                                discountValue: `${shownDiscountValue}`,
                                unitPrice: monthlyFee.toFixed(2),
                                total: lineTotal.toFixed(2),
                            });

                            subTotal += monthlyFee;
                        }
                    }

                    // Inventory Fee - only for first invoice
                    if (isFirstInvoice) {
                        const inventoryItems = await tx.select({
                            name: schema.inventory.items,
                            quantity: schema.studentInventory.quantity,
                            amount: schema.inventory.amount,
                            totalAmount: schema.studentInventory.totalAmount,
                            discountType: schema.studentInventory.discountType,
                            discountValue: schema.studentInventory.discountValue,
                        })
                            .from(schema.studentInventory)
                            .innerJoin(schema.inventory, eq(schema.studentInventory.inventoryId, schema.inventory.id))
                            .where(eq(schema.studentInventory.studentId, student.id));

                        for (const item of inventoryItems) {
                            const total = Number(item.amount) * item.quantity;
                            if (total > 0) {
                                subTotal += total;
                                totalDiscounts += Number(item.discountValue);
                                const lineTotal = total - Number(item.discountValue);
                                invoiceItemsData.push({
                                    description: `${item.name}`,
                                    itemType: 'inventory_fee',
                                    quantity: `${item.quantity}`,
                                    discountType: `${item.discountType}`,
                                    discountValue: `${item.discountValue}`,
                                    unitPrice: total.toFixed(2),
                                    total: lineTotal.toFixed(2),
                                });
                            }
                        }
                    }

                    // Transportation Fee
                    const transport = await tx.select({
                        mode: schema.transportationMode.mode,
                        rate: schema.transportationMode.rate,
                        totalAmount: schema.transportation.totalAmount,
                        discountType: schema.transportation.discountType,
                        discountValue: schema.transportation.discountValue,
                        durationMonths: schema.transportation.durationMonths
                    })
                        .from(schema.transportation)
                        .innerJoin(schema.transportationMode, eq(schema.transportation.modeId, schema.transportationMode.id))
                        .where(and(eq(schema.transportation.studentId, student.id), eq(schema.transportation.status, 'active')));

                    if (transport.length > 0) {
                        const t = transport[0];
                        const monthlyTransportFee = Number(t.rate);
                        const duration = Number(t.durationMonths);
                        let discountAmount = 0;
                        let shownDiscountValue = 0;

                        const existingTransportInvoiceCount = existingInvoiceCounts[`transport_${t.mode}`] || 0;
                        const shouldApplyDiscount = (isFirstInvoice || duration > 1) && existingTransportInvoiceCount < duration;

                        if (monthlyTransportFee > 0) {
                            if (shouldApplyDiscount) {
                                if (t.discountType === 'percentage') {
                                    const splitPercentage = duration > 1
                                        ? Number(t.discountValue) / duration
                                        : Number(t.discountValue);
                                    discountAmount = (monthlyTransportFee * splitPercentage) / 100;
                                    shownDiscountValue = splitPercentage;
                                } else if (t.discountType === 'amount') {
                                    discountAmount = duration > 1
                                        ? Number(t.discountValue) / duration
                                        : Number(t.discountValue);
                                    shownDiscountValue = discountAmount;
                                }

                                totalDiscounts += discountAmount;
                            }

                            const lineTotal = monthlyTransportFee - discountAmount;

                            invoiceItemsData.push({
                                description: `Transportation - ${t.mode}`,
                                itemType: 'transport_fee',
                                discountType: `${t.discountType}`,
                                discountValue: `${shownDiscountValue}`,
                                unitPrice: monthlyTransportFee.toFixed(2),
                                total: lineTotal.toFixed(2),
                            });

                            subTotal += monthlyTransportFee;
                        }
                    }

                    // Apply Credit Notes
                    const openCreditNotes = await tx.select().from(schema.creditNotes)
                        .where(and(eq(schema.creditNotes.studentId, student.id),
                            eq(schema.creditNotes.status, 'open')));

                    for (const cn of openCreditNotes) {
                        const creditAmount = parseFloat(cn.amount);
                        subTotal -= creditAmount;
                        invoiceItemsData.push({
                            description: `${cn.reason}`,
                            itemType: 'credit_note_adj',
                            unitPrice: (-creditAmount).toFixed(2),
                            total: (-creditAmount).toFixed(2)
                        });
                    }
                    let totalAmount = subTotal - totalDiscounts;
                    const vatAmount = totalAmount * 0.05;

                    if (totalAmount <= 0) {
                        console.log(`Skipping invoice for student ${student.id}: Total is zero or negative after credits.`);
                        return;
                    }

                    const advancePayments = await tx.select({
                        id: schema.studentPayments.id,
                        advanceAmount: schema.studentPayments.advanceAmount
                    }).from(schema.studentPayments)
                        .where(and(
                            eq(schema.studentPayments.studentId, student.id),
                            eq(schema.studentPayments.status, "paid"),
                            eq(schema.studentPayments.state, "active"),
                        ));

                    let totalAdvanceAvailable = 0;
                    for (const adv of advancePayments) {
                        totalAdvanceAvailable += Number(adv.advanceAmount || 0);
                    }

                    let appliedAdvance = 0;
                    let remainingAmount = totalAmount;

                    if (totalAdvanceAvailable > 0) {
                        appliedAdvance = Math.min(totalAdvanceAvailable, totalAmount);
                        remainingAmount -= appliedAdvance;
                    }

                    let remainingToApply = appliedAdvance;

                    for (const adv of advancePayments) {
                        if (remainingToApply <= 0) break;

                        const available = Number(adv.advanceAmount || 0);
                        const applyNow = Math.min(available, remainingToApply);
                        const newRemaining = available - applyNow;

                        await tx.update(schema.studentPayments)
                            .set({
                                advanceAmount: newRemaining.toFixed(2),
                                state: newRemaining === 0 ? "inactive" : "active"
                            })
                            .where(eq(schema.studentPayments.id, adv.id));

                        remainingToApply -= applyNow;
                    }

                    const invoiceStatus =
                        appliedAdvance >= totalAmount ? "paid" :
                            appliedAdvance > 0 ? "partially_paid" :
                                "unpaid";

                    const amountPaidValue = appliedAdvance > 0 ? appliedAdvance.toFixed(2) : "0";

                    const [newInvoice] = await tx.insert(schema.invoices).values({
                        invoiceNumber,
                        studentId: student.id,
                        issueDate: today.toISOString().split('T')[0],
                        dueDate: new Date(today.getFullYear(), today.getMonth(), 30).toISOString().split('T')[0],
                        amountPaid: amountPaidValue,
                        subTotal: subTotal.toFixed(2),
                        vatAmount: vatAmount.toFixed(2),
                        discountAmount: totalDiscounts.toFixed(2),
                        totalAmount: totalAmount.toFixed(2),
                        status: invoiceStatus,
                    }).returning();

                    await tx.insert(schema.invoiceItems).values(
                        invoiceItemsData.map(item => ({
                            ...item, invoiceId: newInvoice.id,
                            quantity: item.quantity && !isNaN(Number(item.quantity)) ? Number(item.quantity) : 1,
                        }))
                    );

                    for (const cn of openCreditNotes) {
                        await tx.update(schema.creditNotes)
                            .set({ status: 'approved', appliedInvoiceId: newInvoice.id, appliedToType: 'Against invoice ' + newInvoice.invoiceNumber })
                            .where(eq(schema.creditNotes.id, cn.id));
                    }

                    console.log(`Successfully created invoice ${newInvoice.invoiceNumber} for student ${student.id}.`);

                    await sendEmail(
                        'invoice',
                        student.email!,
                        "Invoice for the month of " + invoiceMonthStr,
                        {
                            invoiceNumber: newInvoice.invoiceNumber,
                            invoiceMonth: invoiceMonthStr,
                            totalAmount: totalAmount.toFixed(2),
                            dueDate: newInvoice.dueDate,
                        },
                    );

                });
            } catch (err) {
                console.error(`Error generating invoice for student ${student.id}:`, err);
            }
        }

        console.log('Finished monthly invoice generation.');
    } catch (error) {
        console.error('CRITICAL ERROR during monthly invoice generation:', error);
    }
}

// --- SCHEDULER DEFINITIONS ---    

console.log('[CRON] Initializing scheduled jobs for invoicing...');

// cron.schedule('0 23 * * *', () => {
//     const today = new Date();
//     const tomorrow = new Date();
//     tomorrow.setDate(today.getDate() + 1);

//     if (today.getMonth() !== tomorrow.getMonth()) {
//         console.log(`[CRON] It's the end of the month. Running credit note generation at ${new Date()}`);
//         generateCreditNotesForMissedClasses(2025,5);
//         // generateCreditNotesForMissedClasses(today.getFullYear(), today.getMonth());
//     }
// }, {
//     timezone: "Asia/Dubai"
// });

// Every Minute
// cron.schedule('* * * * *', () => { 
//     console.log('Running credit note generation every minute for testing...');
//     generateCreditNotesForMissedClasses();
// });

// cron.schedule('0 2 1 * *', () => {
//     console.log(`[CRON] It's the 1st of the month. Running monthly invoice generation at ${new Date()}`);
//     generateMonthlyInvoices();
// }, {
//     timezone: "Asia/Dubai"
// });

// Every minute (for test only!)
// cron.schedule('*/5 * * * *', () => {
//     console.log(`[TEST CRON] Triggering monthly invoice generation at ${new Date()}`);
//     generateMonthlyInvoices();
// });

// generateCreditNotesForMissedClasses(2025,5);
// generateMonthlyInvoices();