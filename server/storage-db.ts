import {
  users, User, InsertUser,
  courses, Course, InsertCourse,
  departments, Department, InsertDepartment,
  batches, Batch, InsertBatch,
  students, Student, InsertStudent,
  parents, Parent, InsertParent,
  enrollments, Enrollment, InsertEnrollment,
  studentEnrollmentFees, StudentEnrollmentFees, InsertStudentEnrollmentFees,
  attendance, Attendance, InsertAttendance,
  payments, Payment, InsertPayment,
  employees, Employee, InsertEmployee,
  payrolls, Payroll, InsertPayroll,
  messages, Message, InsertMessage,
  branches, Branch, InsertBranch,
  schedules, Schedule, InsertSchedule,
  transportation, Transportation, InsertTransportation,
  transportationMode, TransportationMode, InsertTransportationMode,
  inventory, Inventory, InsertInventory,
  studentInventory, StudentInventory, InsertStudentInventory,
  InsertStudio,
  Studio,
  studio,
  brands, Brand, InsertBrand,
  branchBrands, BranchBrand, InsertBranchBrand,
  studentCourseFee, StudentCourseFee, InsertStudentCourseFee,
  invoices, Invoice, InsertInvoice,
  invoiceItems,
  studentPayments, StudentPayment, InsertStudentPayment,
  receipts, Receipt, InsertReceipt,
  creditNotes, CreditNote, InsertCreditNote,
  paymentItems, PaymentItem, InsertPaymentItem,
  stockItem, InsertStockItem, StockItem,
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool, db } from "./db";
import { eq, and, like, asc, sql, or, desc, inArray } from "drizzle-orm";
import { IStorage } from "./storage";
import { hashPassword } from "./auth";
import { format } from "date-fns";

// PostgreSQL session store
const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  updateUserPassword(username: string, newPassword: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return result[0];
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db
      .insert(users)
      .values({
        ...user,
        password: String(user.password), // Ensure password is a string
        createdAt: new Date(),
      })
      .returning();
    return result[0];
  }

  async updateUser(id: number, user: Partial<User>): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  // Get attendance records for a specific batch within a date range
  async getBatchAttendance(batchId: number, startDate: Date, endDate: Date): Promise<Attendance[]> {

    // Format dates to match PostgreSQL date format (YYYY-MM-DD)
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];

    // Create the query
    const query = db
      .select({
        id: attendance.id,
        date: attendance.date,
        status: attendance.status,
        studentId: attendance.studentId,
        batchId: attendance.batchId,
        createdAt: attendance.createdAt,
        updatedAt: attendance.updatedAt,
        compensationBatchName: attendance.compensationBatchName,
        compensationDate: attendance.compensationDate
      })
      .from(attendance)
      .where(
        and(
          eq(attendance.batchId, batchId),
          sql`${attendance.date}::date >= ${formattedStartDate}::date`,
          sql`${attendance.date}::date <= ${formattedEndDate}::date`
        )
      )
      .orderBy(attendance.date);

    // Execute the query
    const result = await query;
    return result;
  }

  // Course methods
  async getCourse(id: number): Promise<Course | undefined> {
    const result = await db.select().from(courses).where(eq(courses.id, id));
    return result[0];
  }

  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses);
  }

  // async getCoursesByBranchId(branchId: number) {
  //   return db.course.findMany({
  //     where: { branchId }
  //   });
  // }

  async getCoursesByCategory(category: string): Promise<Course[]> {
    return await db
      .select()
      .from(courses)
      .where(eq(courses.category, category));
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const result = await db
      .insert(courses)
      .values({
        ...course,
        createdAt: new Date(),
      })
      .returning();
    return result[0];
  }

  async updateCourse(
    id: number,
    course: Partial<Course>
  ): Promise<Course | undefined> {
    const result = await db
      .update(courses)
      .set(course)
      .where(eq(courses.id, id))
      .returning();
    return result[0];
  }

  async deleteCourse(id: number): Promise<boolean> {
    const result = await db
      .delete(courses)
      .where(eq(courses.id, id))
      .returning();
    return result.length > 0;
  }

  // Department methods
  async getDepartment(id: number): Promise<Department | undefined> {
    const result = await db
      .select()
      .from(departments)
      .where(eq(departments.id, id));
    return result[0];
  }

  async getDepartments(): Promise<Department[]> {
    return await db.select().from(departments);
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const result = await db
      .insert(departments)
      .values({
        ...department,
        createdAt: new Date(),
      })
      .returning();
    return result[0];
  }

  async updateDepartment(
    id: number,
    department: Partial<Department>
  ): Promise<Department | undefined> {
    const result = await db
      .update(departments)
      .set(department)
      .where(eq(departments.id, id))
      .returning();
    return result[0];
  }

  async deleteDepartment(id: number): Promise<boolean> {
    const result = await db
      .delete(departments)
      .where(eq(departments.id, id))
      .returning();
    return result.length > 0;
  }

  // Brand methods
  async getBrands(): Promise<Brand[]> {
    return await db.select().from(brands);
  }

  async getBrand(id: number): Promise<Brand | undefined> {
    const result = await db
      .select()
      .from(brands)
      .where(eq(brands.id, id));
    return result[0];
  }

  async createBrand(brand: InsertBrand): Promise<Brand> {
    const result = await db
      .insert(brands)
      .values({
        ...brand,
        createdAt: new Date(),
      })
      .returning();
    return result[0];
  }

  async updateBrand(
    id: number,
    brand: Partial<Brand>
  ): Promise<Brand | undefined> {
    const result = await db
      .update(brands)
      .set(brand)
      .where(eq(brands.id, id))
      .returning();
    return result[0];
  }

  async deleteBrand(id: number): Promise<boolean> {
    const result = await db
      .delete(brands)
      .where(eq(brands.id, id))
      .returning();
    return result.length > 0;
  }

  // Schedule methods
  async getSchedule(id: number): Promise<Schedule | undefined> {
    const result = await db
      .select()
      .from(schedules)
      .where(eq(schedules.id, id));
    return result[0];
  }

  async getSchedules(): Promise<Schedule[]> {
    return await db.select().from(schedules);
  }

  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const result = await db.insert(schedules).values({
      day: schedule.day,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      batchId: schedule.batchId,
      duration: schedule.duration,
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  async updateSchedule(
    id: number,
    schedule: Partial<Schedule>
  ): Promise<Schedule | undefined> {
    const result = await db
      .update(schedules)
      .set(schedule)
      .where(eq(schedules.id, id))
      .returning();
    return result[0];
  }

  async deleteSchedule(id: number): Promise<boolean> {
    const result = await db
      .delete(schedules)
      .where(eq(schedules.id, id))
      .returning();
    return result.length > 0;
  }

  async deleteBatchSchedule(id: number): Promise<boolean> {
    const result = await db
      .delete(schedules)
      .where(eq(schedules.batchId, id))
      .returning();
    return result.length > 0;
  }

  //  Studio methods
  async createStudio(stud: InsertStudio): Promise<Studio> {
    const result = await db.insert(studio).values(stud).returning();
    return result[0];
  }

  async getStudios(): Promise<Studio[]> {
    return await db.select().from(studio);
  }

  async getStudio(id: number): Promise<Studio | undefined> {
    const result = await db
      .select()
      .from(studio)
      .where(eq(studio.id, id));
    return result[0];
  }

  async updateStudio(
    id: number,
    studiodata: Partial<Studio>
  ): Promise<Studio | undefined> {
    const result = await db
      .update(studio)
      .set(studiodata)
      .where(eq(studio.id, id))
      .returning();
    return result[0];
  }

  async deleteStudio(id: number): Promise<boolean> {
    const result = await db
      .delete(studio)
      .where(eq(studio.id, id))
      .returning();
    return result.length > 0;
  }

  // Batch methods
  async getBatch(id: number): Promise<(Batch & { schedules: Schedule[] }) | undefined> {
    const batchResults = await db.select().from(batches).where(eq(batches.id, id));
    const scheduleResults = await db.select().from(schedules).where(eq(schedules.batchId, id));
    return {
      ...batchResults[0],
      schedules: scheduleResults
    };
  }

  async getBatches(): Promise<(Batch & { schedules: Schedule[] })[]> {
    const batchResults = await db.select().from(batches);

    // Get all schedules in one query
    const allSchedules = await db.select().from(schedules);

    // Map schedules to batches
    return batchResults.map(batch => ({
      ...batch,
      schedules: allSchedules.filter(s => s.batchId === batch.id)
    }));
  }

  async getBatchesByCourse(courseId: number): Promise<Batch[]> {
    return await db
      .select()
      .from(batches)
      .where(eq(batches.courseId, courseId));
  }

  async getBatchesByTeacher(teacherId: number): Promise<Batch[]> {
    return await db
      .select()
      .from(batches)
      .where(eq(batches.teacherId, teacherId));
  }

  // async getBatchesByBranch(branch: string): Promise<Batch[]> {
  //   return await db.select().from(batches).where(eq(batches.branch, branch));
  // }

  // async getBatchesByBranch(branch: string) {
  //   return await db
  //     .select()
  //     .from(batches)
  //     .where(eq(batches.branch, branch));
  // }

  async getBatchesByBranch(branch: string): Promise<(Batch & { schedules: Schedule[] })[]> {
    const batchResults = await db
      .select()
      .from(batches)
      .where(eq(batches.branch, branch));

    const batchIds = batchResults.map(b => b.id);

    const scheduleResults = await db
      .select()
      .from(schedules)
      .where(inArray(schedules.batchId, batchIds));

    // Group schedules by batchId
    const schedulesByBatchId: Record<number, Schedule[]> = {};
    for (const schedule of scheduleResults) {
      if (!schedulesByBatchId[schedule.batchId]) {
        schedulesByBatchId[schedule.batchId] = [];
      }
      schedulesByBatchId[schedule.batchId].push(schedule);
    }

    // Merge schedules into batches
    const batchesWithSchedules = batchResults.map(batch => ({
      ...batch,
      schedules: schedulesByBatchId[batch.id] || [],
    }));

    return batchesWithSchedules;
  }

  async createBatch(batch: InsertBatch): Promise<Batch> {
    const result = await db.insert(batches).values({
      ...batch,
      status: batch.status || "active",
      roomNumber: batch.roomNumber || null,
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  async updateBatch(
    id: number,
    batch: Partial<Batch>
  ): Promise<Batch | undefined> {
    const result = await db
      .update(batches)
      .set(batch)
      .where(eq(batches.id, id))
      .returning();
    return result[0];
  }

  async deleteBatch(id: number): Promise<boolean> {
    const result = await db
      .delete(batches)
      .where(eq(batches.id, id))
      .returning();
    return result.length > 0;
  }

  // Student methods
  async getStudent(id: number): Promise<Student | undefined> {
    const result = await db.select().from(students).where(eq(students.id, id));
    return result[0];
  }

  async getStudentByStudentId(studentId: string): Promise<Student | undefined> {
    const result = await db
      .select()
      .from(students)
      .where(eq(students.studentId, studentId));
    return result[0];
  }

  async getStudents(): Promise<Student[]> {
    return await db.select().from(students).where(or(eq(students.status, 'active'), eq(students.status, 'inactive')));
  }

  async getStudentsByParent(parentId: number): Promise<Student[]> {
    return await db
      .select()
      .from(students)
      .where(eq(students.parentId, parentId));
  }

  // async getStudentsWithParents() {
  //   return await db
  //     .select()
  //     .from(students)
  //     .innerJoin(parents, eq(students.parentId, parents.userId));
  // }  

  async getStudentsWithParents(parentId: number) {
    return await db
      .select({
        studentIds: students.id,
        studentId: students.studentId,
        studentFirstName: students.firstName,
        studentMiddleName: students.middleName,
        studentLastName: students.lastName,
        studentDateOfBirth: students.dateOfBirth,
        studentAge: students.age,
        studentGender: students.gender,
        studentStatus: students.status,
      })
      .from(students)
      .innerJoin(parents, eq(parents.userId, students.parentId))
      .where(eq(students.parentId, parentId));
  }

  // async getStudentsByBranch(branch: string): Promise<Student[]> {
  //   // First get batches for this branch
  //   const branchBatches = await db
  //     .select()
  //     .from(batches)
  //     .where(eq(batches.branch, branch));
  //   const batchIds = branchBatches.map((batch) => batch.id);

  //   // Then get enrollments for these batches
  //   const batchEnrollments = await db
  //     .select()
  //     .from(enrollments)
  //     .where(sql`${enrollments.batchId} = ANY(${batchIds})`);
  //   const studentIds = batchEnrollments.map(
  //     (enrollment) => enrollment.studentId
  //   );

  //   // Finally get the students
  //   return await db
  //     .select()
  //     .from(students)
  //     .where(sql`${students.id} = ANY(${studentIds})`);
  // }
  async getStudentsByBranch(branchId: string): Promise<Student[]> {
    // Step 1: Get batch IDs for the branch
    const batchesForBranch = await db
      .select({ id: batches.id })
      .from(batches)
      .where(eq(batches.branch, branchId));

    const batchIds = batchesForBranch.map((b) => b.id);
    if (batchIds.length === 0) return [];

    // Step 2: Get enrollments for those batch IDs
    const enrollmentsForBatch = await db
      .select({ studentId: enrollments.studentId })
      .from(enrollments)
      .where(inArray(enrollments.batchId, batchIds));

    const studentIds = enrollmentsForBatch.map((e) => e.studentId);
    if (studentIds.length === 0) return [];

    // Step 3: Get students with status filter
    const studentsInBranch = await db
      .select()
      .from(students)
      .where(
        and(
          inArray(students.id, studentIds),
          or(
            eq(students.status, 'active'),
            eq(students.status, 'inactive')
          )
        )
      );

    return studentsInBranch;
  }

  async getStudentsWithBranch() {
    const result = await db
      .selectDistinct({
        student_id: students.id,
        first_name: students.firstName,
        branch_id: enrollments.branchId,
        branch_name: branches.name,
        status: students.status,
      })
      .from(students)
      .leftJoin(enrollments, eq(enrollments.studentId, students.id))
      .leftJoin(branches, eq(branches.id, enrollments.branchId))

    return result;
  }

  async getStudentsByBatch(batchId: string): Promise<Student[]> {
    // Get enrollments for this batch
    const batchEnrollments = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.batchId, Number(batchId)));

    const studentIds = batchEnrollments.map(
      (enrollment) => enrollment.studentId
    );

    // Get the students
    return await db
      .select()
      .from(students)
      .where(sql`${students.id} = ANY(${studentIds})`);
  }

  async getStudentCountByBatch(batchId: number): Promise<number> {
    const result = await db
      .select({
        student_count: sql<number>`COUNT(DISTINCT ${enrollments.studentId})`,
      })
      .from(enrollments)
      .where(and(eq(enrollments.batchId, batchId), eq(enrollments.status, 'active')));

    return result[0]?.student_count ?? 0;
  }

  async getStudentCourseCount(studentId: number): Promise<number> {
    const result = await db
      .select({
        courseCount: sql<number>`COUNT(*)`,
      })
      .from(enrollments)
      .where(eq(enrollments.studentId, studentId))
      .groupBy(enrollments.studentId);

    return result[0]?.courseCount ?? 0;
  }

  async getStudentCourseDetails(parentId: number) {
    const result = await db
      .select({
        studentId: students.id,
        student: students.firstName,
        parentFirstName: parents.firstName,
        parentMiddleName: parents.middleName,
        parentLastName: parents.lastName,
        batchName: batches.name,
        courseName: courses.name,
        day: schedules.day,
        startTime: schedules.startTime,
        endTime: schedules.endTime
      })
      .from(students)
      .innerJoin(parents, eq(parents.userId, students.parentId))
      .innerJoin(enrollments, eq(students.id, enrollments.studentId))
      .innerJoin(courses, eq(courses.id, enrollments.courseId))
      .innerJoin(batches, eq(batches.id, enrollments.batchId))
      .innerJoin(schedules, eq(schedules.batchId, batches.id))
      .where(and(eq(students.parentId, parentId), eq(enrollments.status, 'active')));

    const grouped = result.reduce((acc, row) => {
      const key = row.studentId;
      if (!acc[key]) {
        acc[key] = {
          studentId: row.studentId,
          student: row.student,
          parentFirstName: row.parentFirstName,
          parentMiddleName: row.parentMiddleName,
          parentLastName: row.parentLastName,
          courses: [],
          // day: row.day,
          // startTime: row.startTime,
          // endTime: row.endTime
        };
      }
      const alreadyExists = acc[key].courses.some(
        (c: any) => c.courseName === row.courseName && c.batchName === row.batchName
      );

      // if (!alreadyExists) {
      //   acc[key].courses.push({
      //     courseName: row.courseName,
      //     batchName: row.batchName,
      //     day: row.day,
      //     startTime: row.startTime,
      //     endTime: row.endTime
      //   });
      // }
      let courseEntry = acc[key].courses.find(
        (c: any) => c.courseName === row.courseName
      );

      if (!courseEntry) {
        courseEntry = {
          courseName: row.courseName,
          batches: [],
        };
        acc[key].courses.push(courseEntry);
      }

      let batchEntry = courseEntry.batches.find(
        (b: any) => b.batchName === row.batchName
      );

      if (!batchEntry) {
        batchEntry = {
          batchName: row.batchName,
          schedule: [],
        };
        courseEntry.batches.push(batchEntry);
      }

      batchEntry.schedule.push({
        day: row.day,
        startTime: row.startTime,
        endTime: row.endTime,
      });

      return acc;
    }, {} as Record<number, any>);

    return Object.values(grouped);
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const result = await db.insert(students).values({
      studentId: student.studentId,
      firstName: student.firstName,
      middleName: student.middleName ?? null,
      lastName: student.lastName,
      parentId: student.parentId,
      email: student.email ?? null,
      phone: student.phone ?? null,
      whatsappNo: student.whatsappNo ?? null,
      residenceAddress: student.residenceAddress ?? null,
      street: student.street ?? null,
      community: student.community ?? null,
      flatNo: student.flatNo ?? null,
      dateOfBirth: student.dateOfBirth ?? null,
      age: student.age ?? null,
      gender: student.gender ?? null,
      registrationDate: student.registrationDate ?? null,
      registrationFee: student.registrationFee ?? null,
      isReRegistering: student.isReRegistering ?? "no",
      status: student.status ?? "active",
      course: student.course ?? null,
      branch: student.branch ?? null,
    }).returning();

    return result[0];
  }

  async getNotJoinedStudents(): Promise<Student[]> {
    const result = await db.select().from(students).where(eq(students.status, 'not_joined'));
    return result;
  }

  async updateStudent(id: number, student: Partial<Student>): Promise<Student | undefined> {
    const result = await db.update(students)
      .set(student)
      .where(eq(students.id, id))
      .returning();
    return result[0];
  }

  async deleteStudent(id: number): Promise<boolean> {
    const result = await db.delete(students).where(eq(students.id, id)).returning();
    return result.length > 0;
  }

  // Parent methods
  async getParent(id: number): Promise<Parent | undefined> {
    const result = await db.select().from(parents).where(eq(parents.id, id));
    return result[0];
  }

  async getParents(): Promise<Parent[]> {
    return await db.select().from(parents);
  }

  async getParentByUserId(userId: number): Promise<Parent | undefined> {
    const result = await db
      .select()
      .from(parents)
      .where(eq(parents.userId, userId));
    return result[0];
  }

  async getStudentCountByParentId(parentId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`COUNT(*)`.as('StudentCount') })
      .from(students)
      .where(eq(students.parentId, parentId));

    return result[0]?.count ?? 0;
  }

  async createParent(parent: InsertParent): Promise<Parent> {
    const hashedPassword = await hashPassword(parent.password!);
    const [user] = await db
      .insert(users)
      .values({
        username: parent.username,
        email: parent.email!,
        password: hashedPassword,
        fullName: parent.firstName + " " + parent.middleName + " " + parent.lastName,
        role: "parent",
        phone: parent.phone,
        address: parent.residenceAddress,
        branch: parent.community,
        createdAt: new Date(),
      })
      .returning();

    const result = await db
      .insert(parents)
      .values({
        ...parent,
        userId: user.id,
        createdAt: new Date(),
      })
      .returning();
    return result[0];
  }

  async updateParent(
    id: number,
    parent: Partial<Parent>
  ): Promise<any | undefined> {
    console.log(parent);

    const result = await db
      .update(parents)
      .set(parent)
      .where(eq(parents.id, id))
      .returning();

    console.log(result);

    return result[0];
  }

  // async deleteParent(id: number): Promise<boolean> {
  //   const result = await db
  //     .delete(parents)
  //     .where(eq(parents.id, id))
  //     .returning();
  //   return result.length > 0;
  // }

  async deleteParent(id: number): Promise<boolean> {
    // Step 1: Get the parent record to retrieve userId
    const parent = await db
      .select({ userId: parents.userId })
      .from(parents)
      .where(eq(parents.id, id))
      .then((rows) => rows[0]);

    if (!parent) return false;

    await db.delete(parents).where(eq(parents.id, id));
    await db.delete(users).where(eq(users.id, parent.userId));

    return true;
  }

  async getInvoicesByParentId(parentId: number, statuses?: string[]) {
    const whereClause = [
      eq(students.parentId, parentId),
      statuses && statuses.length > 0 ? inArray(invoices.status, statuses) : undefined,
    ].filter(Boolean);

    const result = await db
      .select({
        invoices: invoices,
        studentId: students.studentId,
        firstName: students.firstName,
        middleName: students.middleName,
        lastName: students.lastName,
      })
      .from(invoices)
      .innerJoin(students, eq(invoices.studentId, students.id))
      .where(and(...whereClause))
      .orderBy(invoices.id);

    return result;
  }

  async getAttendanceWithParent(studentId: number) {
    const result = await db
      .select({
        studentId: attendance.studentId,
        date: attendance.date,
        batchName: batches.name,
        status: attendance.status,
        parentName: parents.firstName,
      })
      .from(attendance)
      .innerJoin(batches, eq(attendance.batchId, batches.id))
      .innerJoin(students, eq(attendance.studentId, students.id))
      .innerJoin(parents, eq(students.parentId, parents.userId))
      .where(eq(attendance.studentId, studentId));

    console.log("Attendance Records:", result);
    return result;
  }

  async getAttendanceDetailsByStudentId(studentId: number) {
    const result = await db
      .select({
        studentId: attendance.studentId,
        date: attendance.date,
        batchName: batches.name,
        status: attendance.status,
        parentName: parents.firstName,
      })
      .from(attendance)
      .innerJoin(batches, eq(attendance.batchId, batches.id))
      .innerJoin(students, eq(students.id, attendance.studentId))
      .innerJoin(parents, eq(parents.userId, students.parentId))
      .where(eq(attendance.studentId, studentId));

    return result;
  }

  // async getAttendanceByParentUserId(userId: number, studentId: number) {
  //   console.log('Query params:', { userId, studentId });
  //   return await db
  //     .select({
  //       studentId: attendance.studentId,
  //       date: attendance.date,
  //       batchName: batches.name,
  //       status: attendance.status,
  //       parentName: parents.firstName,
  //     })
  //     .from(attendance)
  //     .innerJoin(batches, eq(attendance.batchId, batches.id))
  //     .innerJoin(students, eq(students.id, attendance.studentId))
  //     .innerJoin(parents, eq(parents.userId, students.parentId))
  //     .where(
  //       and(
  //         eq(parents.userId, userId),
  //         eq(attendance.studentId, studentId)
  //       )
  //     );
  // }  

  async updateAttendanceCompensation(attendanceId: number, compensationDate: string, compensationBatchName: string) {
    await db
      .update(attendance)
      .set({
        compensationDate: compensationDate,
        compensationBatchName: compensationBatchName
      })
      .where(eq(attendance.id, attendanceId));
  }

  async getAttendanceByParentUserId(userId: number, studentId?: string) {
    // console.log('Getting attendance for:', { userId, studentId });

    // First get the parent record
    const parent = await db
      .select()
      .from(parents)
      .where(eq(parents.userId, userId))
      .limit(1);

    if (parent.length === 0) {
      throw new Error('Parent not found');
    }

    const conditions = [eq(parents.userId, userId)];

    if (studentId !== undefined) {
      const studentIdNum = parseInt(studentId, 10);
      if (isNaN(studentIdNum)) {
        throw new Error('Invalid student ID format');
      }
      conditions.push(eq(students.id, studentIdNum));
    }

    const result = await db
      .select({
        id: attendance.id,
        studentId: students.id,
        date: attendance.date,
        batchName: batches.name,
        status: attendance.status,
        parentName: parents.firstName,
        compensationDate: attendance.compensationDate,
        compensationBatchName: attendance.compensationBatchName,
      })
      .from(attendance)
      .innerJoin(batches, eq(attendance.batchId, batches.id))
      .innerJoin(students, eq(students.id, attendance.studentId))
      .innerJoin(parents, eq(parents.userId, students.parentId))
      .where(and(...conditions))
      .orderBy(desc(attendance.date));

    // console.log('Found attendance records:', result.length);
    return result;
  }

  // Enrollment methods
  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    const result = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.id, id));
    return result[0];
  }

  async getEnrollments(): Promise<Enrollment[]> {
    return await db.select().from(enrollments);
  }

  async getActiveEnrollments(): Promise<Enrollment[]> {
    return await db.select().from(enrollments).where(eq(enrollments.status, "active"));
  }

  async getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]> {
    return await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.studentId, studentId));
  }

  async getActiveEnrollmentCountByParentId(parentId: number): Promise<number> {
    const [row] = await db
      .select({
        activeEnrollments: sql<number>`COUNT(DISTINCT CONCAT(${enrollments.studentId}, '-', ${enrollments.courseId}, '-', ${enrollments.batchId}))
      `.as('activeEnrollments')
      })
      .from(enrollments)
      .innerJoin(students, eq(enrollments.studentId, students.id))
      .where(
        and(
          eq(students.parentId, parentId),
          eq(enrollments.status, 'active')
        )
      );
    return row?.activeEnrollments ?? 0;
  }

  async getEnrollmentsByBatch(batchId: number): Promise<Enrollment[]> {
    return await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.batchId, batchId));
  }

  async getUniqueEnrollmentsByBatch(batchId: number) {
    const result = await db.execute(sql`
        WITH ranked_enrollments AS (
          SELECT
            students.first_name,
            students.middle_name,
            students.last_name,
            enrollments.*,
            batches.name AS batch_name,
            ROW_NUMBER() OVER (
              PARTITION BY enrollments.student_id, enrollments.course_id, enrollments.batch_id
              ORDER BY enrollments.id
            ) AS row_num
          FROM enrollments
          LEFT JOIN students ON students.id = enrollments.student_id
          JOIN batches ON batches.id = enrollments.batch_id
          WHERE batches.id = ${batchId}
        )
        SELECT *
        FROM ranked_enrollments
        WHERE row_num = 1
      `);

    return result.rows;
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const result = await db
      .insert(enrollments)
      .values({
        ...enrollment,
        status: enrollment.status || "active",
        createdAt: new Date(),
      })
      .returning();
    return result[0];
  }

  async updateEnrollment(
    id: number,
    enrollment: Partial<Enrollment>
  ): Promise<Enrollment | undefined> {
    const result = await db
      .update(enrollments)
      .set(enrollment)
      .where(eq(enrollments.id, id))
      .returning();
    return result[0];
  }

  async deactivateStudentEnrollments(studentId: number, batchId: number) {
    const updated = await db
      .update(enrollments)
      .set({ status: "inactive" })
      .where(
        and(
          eq(enrollments.studentId, studentId),
          eq(enrollments.batchId, batchId)
        )
      )
      .returning();

    return updated;
  }

  async deleteEnrollment(id: number): Promise<boolean> {
    const result = await db
      .delete(enrollments)
      .where(eq(enrollments.id, id))
      .returning();
    return result.length > 0;
  }

  // Student course Fee Methods
  async getStudentCourseFee(id: number): Promise<StudentCourseFee | undefined> {
    const result = await db.select().from(studentCourseFee).where(eq(studentCourseFee.id, id));
    return result[0];
  }

  async getStudentCourseFees(): Promise<StudentCourseFee[]> {
    return await db.select().from(studentCourseFee);
  }

  async createStudentCourseFee(courseFee: InsertStudentCourseFee): Promise<StudentCourseFee> {
    const result = await db.insert(studentCourseFee).values({
      ...courseFee,
      enrollmentId: courseFee.enrollmentId,
      durationMonths: courseFee.durationMonths,
      discountType: courseFee.discountType,
      discountValue: courseFee.discountValue,
      totalFee: courseFee.totalFee,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateStudentCourseFee(id: number, courseFee: Partial<StudentCourseFee>): Promise<StudentCourseFee | undefined> {
    const result = await db.update(studentCourseFee)
      .set(courseFee)
      .where(eq(studentCourseFee.id, id))
      .returning();
    return result[0];
  }

  async deleteStudentCourseFee(id: number): Promise<boolean> {
    const result = await db.delete(studentCourseFee).where(eq(studentCourseFee.id, id)).returning();
    return result.length > 0;
  }

  // Student Enrollment Fee Methods
  async getStudentEnrollmentFee(id: number): Promise<StudentEnrollmentFees | undefined> {
    const result = await db.select().from(studentEnrollmentFees).where(eq(studentEnrollmentFees.id, id));
    return result[0];
  }

  async getStudentEnrollmentFees(): Promise<StudentEnrollmentFees[]> {
    return await db.select().from(studentEnrollmentFees);
  }

  async createStudentEnrollmentFees(enrollmentFee: InsertStudentEnrollmentFees): Promise<StudentEnrollmentFees> {
    const result = await db.insert(studentEnrollmentFees).values({
      ...enrollmentFee,
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateStudentEnrollmentFees(id: number, enrollmentFee: Partial<StudentEnrollmentFees>): Promise<StudentEnrollmentFees | undefined> {
    const result = await db.update(studentEnrollmentFees)
      .set(enrollmentFee)
      .where(eq(studentEnrollmentFees.id, id))
      .returning();
    return result[0];
  }

  async deleteStudentEnrollmentFees(id: number): Promise<boolean> {
    const result = await db.delete(studentEnrollmentFees).where(eq(studentEnrollmentFees.id, id)).returning();
    return result.length > 0;
  }

  //Transportation Methods
  async getTransportation(id: number): Promise<Transportation | undefined> {
    const result = await db
      .select()
      .from(transportation)
      .where(eq(transportation.id, id));
    return result[0];
  }

  async getTransportations(): Promise<Transportation[]> {
    return await db.select().from(transportation);
  }

  async createTransportation(data: InsertTransportation): Promise<Transportation> {
    // console.log("Creating transportation with data:", data);
    try {
      const result = await db.insert(transportation).values({
        ...data,
        createdAt: new Date()
      }).returning();
      // console.log("Transportation creation result:", result);
      return result[0];
    } catch (error) {
      console.error("Database error creating transportation:", error);
      throw error;
    }
  }

  async updateTransportation(
    id: number,
    data: Partial<InsertTransportation>
  ): Promise<Transportation | undefined> {
    const result = await db
      .update(transportation)
      .set(data)
      .where(eq(transportation.id, id))
      .returning();
    return result[0];
  }

  async deleteTransportation(id: number): Promise<boolean> {
    const result = await db
      .delete(transportation)
      .where(eq(transportation.id, id))
      .returning();
    return result.length > 0;
  }

  // Transportation mode methods
  async getTransportationModes(): Promise<TransportationMode[]> {
    return await db.select().from(transportationMode);
  }

  async createTransportationMode(data: InsertTransportationMode): Promise<TransportationMode> {
    try {
      const result = await db.insert(transportationMode).values({
        ...data,
        // createdAt: new Date()
      }).returning();
      return result[0];
    } catch (error) {
      throw error;
    }
  }

  async updateTransportationMode(id: number, data: Partial<InsertTransportationMode>): Promise<TransportationMode | undefined> {
    const result = await db.update(transportationMode)
      .set(data)
      .where(eq(transportationMode.id, id))
      .returning();
    return result[0];
  }

  async deleteTransportationMode(id: number): Promise<boolean> {
    const result = await db.delete(transportationMode).where(eq(transportationMode.id, id)).returning();
    return result.length > 0;
  }

  // Inventory methods
  // async getInventory(id: number): Promise<Inventory | undefined> {
  //   const result = await db.select().from(inventory).where(eq(inventory.id, id));
  //   return result[0];
  // }

  async getInventory(): Promise<Inventory[]> {
    return await db.select().from(inventory);
  }

  // async getInventoryByEnrollment(enrollmentId: number): Promise<Inventory | undefined> {
  //   const result = await db.select().from(inventory).where(eq(inventory.enrollmentId, enrollmentId));
  //   return result[0];
  // }

  async createInventory(data: InsertInventory): Promise<Inventory> {
    // console.log("Creating inventory with data:", data);
    try {
      const result = await db
        .insert(inventory)
        .values({
          ...data,
          createdAt: new Date(),
        })
        .returning();
      // console.log("Inventory creation result:", result);
      return result[0];
    } catch (error) {
      console.error("Database error creating inventory:", error);
      throw error;
    }
  }

  async updateInventory(
    id: number,
    data: Partial<InsertInventory>
  ): Promise<Inventory | undefined> {
    const result = await db
      .update(inventory)
      .set(data)
      .where(eq(inventory.id, id))
      .returning();
    return result[0];
  }

  async deleteInventory(id: number): Promise<boolean> {
    const result = await db
      .delete(inventory)
      .where(eq(inventory.id, id))
      .returning();
    return result.length > 0;
  }

  // Stock Item Methods
  async getStockItem(id: number): Promise<StockItem | undefined> {
    const result = await db.select().from(stockItem).where(eq(stockItem.id, id));
    return result[0];
  }

  async getStockItems(): Promise<StockItem[]> {
    return await db.select().from(stockItem);
  }

  async createStockItem(data: InsertStockItem): Promise<StockItem> {
    try {
      const result = await db.insert(stockItem).values({
        ...data,
      }).returning();
      return result[0];
    } catch (error) {
      throw error;
    }
  }

  async updateStockItem(id: number, data: Partial<InsertStockItem>): Promise<StockItem | undefined> {
    const result = await db.update(stockItem)
      .set(data)
      .where(eq(stockItem.id, id))
      .returning();
    return result[0];
  }

  async deleteStockItem(id: number): Promise<boolean> {
    const result = await db.delete(stockItem).where(eq(stockItem.id, id)).returning();
    return result.length > 0;
  }

  // Student Inventory Methods
  async getStudentInventory(id: number): Promise<StudentInventory | undefined> {
    const result = await db.select().from(studentInventory).where(eq(studentInventory.id, id));
    return result[0];
  }

  async getAllStudentInventory(): Promise<StudentInventory[]> {
    return await db.select().from(studentInventory);
  }

  async getStudentInventoryByStudent(studentId: number): Promise<StudentInventory[]> {
    return await db.select().from(studentInventory).where(eq(studentInventory.studentId, studentId));
  }

  async createStudentInventory(data: InsertStudentInventory): Promise<StudentInventory> {
    try {
      const result = await db.insert(studentInventory).values({
        ...data,
        studentId: data.studentId,
        inventoryId: data.inventoryId,
        quantity: data.quantity,
      }).returning();
      return result[0];
    } catch (error) {
      throw error;
    }
  }

  async updateStudentInventory(id: number, data: Partial<InsertStudentInventory>): Promise<StudentInventory | undefined> {
    const result = await db.update(studentInventory)
      .set(data)
      .where(eq(studentInventory.id, id))
      .returning();
    return result[0];
  }

  async deleteStudentInventory(id: number): Promise<boolean> {
    const result = await db.delete(studentInventory).where(eq(studentInventory.id, id)).returning();
    return result.length > 0;
  }

  // Attendance methods
  async getAttendance(id: number): Promise<Attendance | undefined> {
    const result = await db
      .select()
      .from(attendance)
      .where(eq(attendance.id, id));
    return result[0];
  }

  // async getAttendanceByStudent(studentId: number): Promise<Attendance[]> {
  //   return await db
  //     .select()
  //     .from(attendance)
  //     .where(eq(attendance.studentId, studentId));
  // }

  async getAttendanceByStudent(studentId: number): Promise<any[]> {
    return await db
      .select({
        batchName: batches.name,
        date: attendance.date,
        status: attendance.status,
        firstName: students.firstName,
        middleName: students.middleName,
        studentId: students.id,
        lastName: students.lastName,
      })
      .from(attendance)
      .innerJoin(batches, eq(batches.id, attendance.batchId))
      .innerJoin(students, eq(students.id, attendance.studentId))
      .where(eq(students.id, studentId));
  }

  async getAttendanceByBatch(batchId: number): Promise<Attendance[]> {
    return await db
      .select()
      .from(attendance)
      .where(eq(attendance.batchId, batchId));
  }

  async getAttendanceByBatchAndDate(batchId: number, date: Date) {
    const formattedDate = date.toISOString().split("T")[0]; // "YYYY-MM-DD"

    return await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.batchId, batchId),
          eq(attendance.date, formattedDate)
        )
      );
  }

  async getAttendanceByDate(date: Date): Promise<Attendance[]> {
    // Format date as YYYY-MM-DD
    const dateStr = date.toISOString().split("T")[0];
    return await db
      .select()
      .from(attendance)
      .where(eq(attendance.date, dateStr));
  }

  async createAttendance(data: InsertAttendance): Promise<Attendance> {
    const result = await db.insert(attendance).values({
      date: data.date,
      status: data.status,
      studentId: data.studentId,
      batchId: data.batchId,
      compensationBatchName: data.compensationBatchName || null,
      compensationDate: data.compensationDate || null,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateAttendance(id: number, attendanceData: Partial<Attendance>): Promise<Attendance | undefined> {
    const result = await db.update(attendance)
      .set({
        ...attendanceData,
        updatedAt: new Date()
      })
      .where(eq(attendance.id, id))
      .returning();
    return result[0];
  }

  async deleteAttendance(id: number): Promise<boolean> {
    const result = await db
      .delete(attendance)
      .where(eq(attendance.id, id))
      .returning();
    return result.length > 0;
  }

  // Payment methods
  async getPayment(id: number): Promise<Payment | undefined> {
    const result = await db.select().from(payments).where(eq(payments.id, id));
    return result[0];
  }

  async getPaymentByInvoiceId(invoiceId: string): Promise<Payment | undefined> {
    const result = await db
      .select()
      .from(payments)
      .where(eq(payments.invoiceId, invoiceId));
    return result[0];
  }

  async getStudentIdByInvoiceId(invoiceId: string): Promise<number | null> {
    const result = await db
      .select({ studentId: payments.studentId })
      .from(payments)
      .where(eq(payments.invoiceId, invoiceId))
      .limit(1);

    return result.length > 0 ? result[0].studentId : null;
  }

  async getPayments(): Promise<Payment[]> {
    return await db.select().from(payments);
  }

  // async getPaymentsByStudent(studentId: number): Promise<Payment[]> {
  //   return await db
  //     .select()
  //     .from(payments)
  //     .where(eq(payments.studentId, studentId));
  // }

  async getPaymentsByStudent(studentId: number): Promise<any[]> {
    const itemData = db
      .select({
        studentId: studentInventory.studentId,
        items: inventory.items,
        quantity: studentInventory.quantity,
        itemDiscountValue: studentInventory.discountValue,
        itemTotalAmount: studentInventory.totalAmount,
      })
      .from(studentInventory)
      .innerJoin(inventory, eq(inventory.id, studentInventory.inventoryId))
      .as('item_data');

    const transportData = db
      .select({
        studentId: transportation.studentId,
        transportDuration: transportation.durationMonths,
        transportationDiscountValue: transportation.discountValue,
        transportationTotalAmount: transportation.totalAmount,
      })
      .from(transportation)
      .as('transport_data');

    return await db
      .select({
        id: students.id,
        studentId: students.studentId,
        firstName: students.firstName,
        middleName: students.middleName,
        lastName: students.lastName,
        registrationFee: students.registrationFee,

        invoiceId: payments.invoiceId,
        paymentAmount: payments.amount,
        paymentDate: payments.paymentDate,
        paymentMethod: payments.paymentMethod,
        paymentStatus: payments.status,

        enrollmentId: enrollments.id,
        courseName: courses.name,
        courseMonths: studentCourseFee.durationMonths,
        courseDiscountValue: studentCourseFee.discountValue,
        courseTotalFees: studentCourseFee.totalFee,

        items: sql`${itemData}.items`,
        quantity: sql`${itemData}.quantity`,
        itemDiscountValue: sql`${itemData}.item_discount_value`,
        itemTotalAmount: sql`${itemData}.item_total_amount`,

        transportDuration: sql`${transportData}.transport_duration`,
        transportationDiscountValue: sql`${transportData}.transportation_discount_value`,
        transportationTotalAmount: sql`${transportData}.transportation_total_amount`,
      })
      .from(students)
      .leftJoin(payments, eq(payments.studentId, students.id))
      .leftJoin(enrollments, eq(enrollments.studentId, students.id))
      .leftJoin(courses, eq(courses.id, enrollments.courseId))
      .leftJoin(studentCourseFee, eq(studentCourseFee.enrollmentId, enrollments.id))
      .leftJoin(itemData, eq(itemData.studentId, students.id))
      .leftJoin(transportData, eq(transportData.studentId, students.id))
      .where(eq(students.id, studentId));
  }

  async getInvoiceDetails(studentId: number, invoiceId: string): Promise<any> {
    // 1. Get base student, payment, and summary fee info
    const baseInfoQuery = await db
      .select({
        student: students,
        payment: payments,
        summary: studentEnrollmentFees,
      })
      .from(students)
      .where(eq(students.id, studentId))
      .leftJoin(payments, and(eq(payments.studentId, students.id), eq(payments.invoiceId, invoiceId)))
      .leftJoin(studentEnrollmentFees, eq(studentEnrollmentFees.studentId, students.id));

    if (!baseInfoQuery.length) {
      return null;
    }
    const { student, payment, summary } = baseInfoQuery[0];

    // 2. Initialize an array to hold all line items for the invoice
    const lineItems = [];

    // 3. Fetch Course Line Items
    const courseItems = await db
      .select({
        description: courses.name,
        price: courses.fee,
        discount: studentCourseFee.discountValue,
        discountType: studentCourseFee.discountType,
        durationMonths: studentCourseFee.durationMonths,
        totalFee: studentCourseFee.totalFee,
      })
      .from(enrollments)
      .where(eq(enrollments.studentId, studentId))
      .innerJoin(courses, eq(courses.id, enrollments.courseId))
      .innerJoin(studentCourseFee, eq(studentCourseFee.enrollmentId, enrollments.id));

    courseItems.forEach(course => {
      const discountFormatted = course.discountType === 'percentage'
        ? `${parseFloat(course.discount ?? "0")}%`
        : parseFloat(course.discount ?? "0").toFixed(2);

      lineItems.push({
        description: course.description,
        quantity: course.durationMonths,
        price: parseFloat(course.price ?? "0"),
        discount: discountFormatted,
        lineTotal: parseFloat(course.totalFee ?? "0"),
      });
    });

    // 4. Fetch Inventory Line Items (e.g., T-shirts)
    const inventoryItems = await db
      .select({
        description: inventory.items,
        quantity: studentInventory.quantity,
        price: inventory.amount, // Assuming inventory table has a base price per unit
        discount: studentInventory.discountValue,
        discountType: studentInventory.discountType,
        totalAmount: studentInventory.totalAmount,
      })
      .from(studentInventory)
      .where(eq(studentInventory.studentId, studentId))
      .innerJoin(inventory, eq(inventory.id, studentInventory.inventoryId));

    inventoryItems.forEach(item => {
      const discountFormatted = item.discountType === 'percentage'
        ? `${parseFloat(item.discount ?? "0")}%`
        : parseFloat(item.discount ?? "0").toFixed(2);
      lineItems.push({
        description: item.description,
        quantity: item.quantity,
        price: item.price, // Price per unit
        discount: discountFormatted,
        lineTotal: parseFloat(item.totalAmount ?? "0"),
      });
    });

    // 5. Fetch Transportation Line Item
    const transportRecord = await db.select({
      durationMonths: transportation.durationMonths,
      totalAmount: transportation.totalAmount,
      discountValue: transportation.discountValue,
      mode: transportationMode.mode,
      rate: transportationMode.rate,
      discountType: transportation.discountType,
    }).from(transportation)
      .where(eq(transportation.studentId, studentId))
      .innerJoin(transportationMode, eq(transportationMode.id, transportation.modeId));

    transportRecord.forEach(transportation => {
      const discountFormatted = transportation.discountType === 'percentage'
        ? `${parseFloat(transportation.discountValue ?? "0")}%`
        : parseFloat(transportation.discountValue ?? "0").toFixed(2);
      lineItems.push({
        description: 'Transportation - ' + transportation.mode,
        quantity: transportation.durationMonths,
        price: transportation.rate,
        discount: discountFormatted,
        lineTotal: parseFloat(transportation.totalAmount ?? "0"),
      });
    });

    // if (transportRecord.length > 0) {
    //   const transport = transportRecord[0];
    //   lineItems.push({
    //     description: 'Transportation'+transportationMode.mode,
    //     quantity: transport.durationMonths,
    //     price: parseFloat(transport.totalAmount ?? "0") + parseFloat(transport.discountValue ?? "0"), // Calculate original price
    //     discount: parseFloat(transport.discountValue ?? "0"),
    //     lineTotal: parseFloat(transport.totalAmount ?? "0"),
    //   });
    // }

    // 6. Fetch Registration Fee Line Item
    if (student && parseFloat(student.registrationFee ?? "0") > 0) {
      lineItems.push({
        description: 'Registration fee',
        quantity: 1,
        price: parseFloat(student.registrationFee ?? "0"),
        discount: 0,
        lineTotal: parseFloat(student.registrationFee ?? "0"),
      });
    }

    // 7. Assemble the final, structured invoice object
    const finalInvoice = {
      invoiceNumber: payment?.invoiceId || invoiceId,
      issueDate: payment?.paymentDate,
      paymentMethod: payment?.paymentMethod,
      billTo: {
        name: `${student.firstName} ${student.middleName} ${student.lastName}`.trim(),
        address: student.phone, // Assuming student table has an 'address' field
      },
      // Add a sequential serial number (SI NO) to each line item
      lineItems: lineItems.map((item, index) => ({
        si_no: index + 1,
        ...item,
      })),
      // Use the pre-calculated totals from the `student_enrollment_fees` table
      summary: {
        totalPrice: summary ? parseFloat(summary.totalPayable ?? "0") : 0,
        discount: summary ? parseFloat(summary.totalDiscount ?? "0") : 0,
        vatAmount: summary ? parseFloat(summary.vatAmount ?? "0") : 0,
        grandTotal: summary ? parseFloat(summary.grandTotal ?? "0") : 0,
      }
    };

    return finalInvoice;
  }

  async getPaymentsByStatus(status: string): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.status, status));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const result = await db
      .insert(payments)
      .values({
        ...payment,
        paymentMethod: payment.paymentMethod || null,
        remarks: payment.remarks || null,
        createdAt: new Date(),
      })
      .returning();
    return result[0];
  }

  async updatePayment(
    id: number,
    payment: Partial<Payment>
  ): Promise<Payment | undefined> {
    const result = await db
      .update(payments)
      .set(payment)
      .where(eq(payments.id, id))
      .returning();
    return result[0];
  }

  async deletePayment(id: number): Promise<boolean> {
    const result = await db
      .delete(payments)
      .where(eq(payments.id, id))
      .returning();
    return result.length > 0;
  }

  // Invoices methods
  async getInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices);
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    const result = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id));
    return result[0];
  }

  async getInvoiceWithItems(invoiceId: number) {
    const results = await db
      .select({
        invoice: invoices,
        item: invoiceItems,
        student: students
      })
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .leftJoin(invoiceItems, eq(invoiceItems.invoiceId, invoices.id))
      .innerJoin(students, eq(students.id, invoices.studentId));

    if (!results.length) return null;

    const { invoice, student } = results[0];

    const items = results[0].item ? results.map(r => r.item) : [];

    const fullName = `${student.firstName} ${student.middleName || ""} ${student.lastName}`.trim().replace(/\s+/g, ' ');

    return {
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      billTo: {
        name: fullName,
        address: student.phone || "",
      },
      lineItems: items.map((item, index) => ({
        si_no: index + 1,
        description: item?.description,
        quantity: item?.quantity,
        price: parseFloat(item?.unitPrice || "0"),
        discount: item?.discountType === "percentage"
          ? `${parseFloat(item?.discountValue || "0")}%`
          : parseFloat(item?.discountValue || "0").toFixed(2),
        discountValue: parseFloat(item?.unitPrice || "0") - parseFloat(item?.total || "0"),
        lineTotal: parseFloat(item?.total || "0"),
      })),
      summary: {
        totalPrice: parseFloat(invoice.subTotal),
        discount: parseFloat(invoice.discountAmount),
        vatAmount: parseFloat(invoice.vatAmount),
        grandTotal: parseFloat(invoice.totalAmount),
      },
      status: invoice.status
    };
  }

  //  async createManualInvoiceWithLogic(studentId: number) {
  //   return await db.transaction(async (tx) => {
  //     const today = new Date();
  //     const invoiceNumber = `INV-${format(today, 'yyyyMMdd')}-${studentId}`;

  //     const student = await tx.query.students.findFirst({
  //       where: eq(students.id, studentId),
  //     });

  //     if (!student || student.status !== 'active') {
  //       throw new Error(`Student with ID ${studentId} not found or is not active.`);
  //     }

  //     const existingInvoices = await tx
  //       .select()
  //       .from(invoices)
  //       .where(eq(invoices.studentId, studentId));

  //     const isFirstInvoice = existingInvoices.length === 0;

  //     let subTotal = 0;
  //     let totalDiscounts = 0;
  //     const invoiceItemsData: any[] = [];

  //     // 1. Registration Fee (only for the very first invoice)
  //     if (isFirstInvoice && student.registrationFee && Number(student.registrationFee) > 0) {
  //       const fee = Number(student.registrationFee);
  //       subTotal += fee;
  //       invoiceItemsData.push({
  //         description: 'Registration Fee',
  //         itemType: 'registration_fee',
  //         unitPrice: fee.toFixed(2),
  //         quantity: 1,
  //         total: fee.toFixed(2),
  //       });
  //     }

  //     // 2. Course Fees
  //     const enrollmentData = await tx
  //       .select({
  //         courseName: courses.name,
  //         originalFee: courses.fee,
  //         totalFee: studentCourseFee.totalFee,
  //         discountType: studentCourseFee.discountType,
  //         discountValue: studentCourseFee.discountValue,
  //         durationMonths: studentCourseFee.durationMonths,
  //         monthsOfYear: studentCourseFee.monthsOfYear,
  //       })
  //       .from(enrollments)
  //       .innerJoin(studentCourseFee, eq(enrollments.id, studentCourseFee.enrollmentId))
  //       .innerJoin(courses, eq(enrollments.courseId, courses.id))
  //       .where(and(eq(enrollments.studentId, studentId), eq(enrollments.status, 'active')));

  //     for (const enr of enrollmentData) {
  //       const monthlyFee = Number(enr.originalFee);
  //       let discountAmount = 0;

  //       if (isFirstInvoice) { // Apply initial discount only on the first invoice
  //           if (enr.discountType === 'percentage') {
  //               discountAmount = (monthlyFee * Number(enr.discountValue)) / 100;
  //           } else if (enr.discountType === 'amount') {
  //               discountAmount = Number(enr.discountValue);
  //           }
  //       }

  //       totalDiscounts += discountAmount;
  //       subTotal += monthlyFee;
  //       invoiceItemsData.push({
  //         description: `${enr.courseName}`,
  //         itemType: 'course_fee',
  //         discountType: `${enr.discountType}`,
  //         discountValue: `${enr.discountValue}`,
  //         unitPrice: monthlyFee.toFixed(2),

  //         total: (monthlyFee - discountAmount).toFixed(2),
  //       });
  //     }

  //     // 3. Inventory Items (only for the very first invoice)
  //     if (isFirstInvoice) {
  //       const inventoryData = await tx
  //         .select({
  //           name: inventory.items,
  //           quantity: studentInventory.quantity,
  //           amount: inventory.amount,
  //           discountValue: studentInventory.discountValue,
  //           discountType: studentInventory.discountType,
  //         })
  //         .from(studentInventory)
  //         .innerJoin(inventory, eq(studentInventory.inventoryId, inventory.id))
  //         .where(eq(studentInventory.studentId, studentId));

  //       for (const item of inventoryData) {
  //         const itemTotal = Number(item.amount) * item.quantity;
  //         const discount = Number(item.discountValue || 0);
  //         subTotal += itemTotal;
  //         totalDiscounts += discount;
  //         invoiceItemsData.push({
  //           description: item.name,
  //           itemType: 'inventory_fee',
  //           discountType: `${item.discountType}`,
  //           discountValue: `${item.discountValue}`,
  //           quantity: item.quantity,
  //           unitPrice: itemTotal.toFixed(2),
  //           total: (itemTotal - discount).toFixed(2),
  //         });
  //       }
  //     }

  //     // 4. Transportation Fee
  //     const transportData = await tx
  //       .select({
  //         mode: transportationMode.mode,
  //         rate: transportationMode.rate,
  //         durationMonths: transportation.durationMonths,
  //         discountType: transportation.discountType,
  //         discountValue: transportation.discountValue,

  //       })
  //       .from(transportation)
  //       .innerJoin(transportationMode, eq(transportation.modeId, transportationMode.id))
  //       .where(and(eq(transportation.studentId, studentId), eq(transportation.status, 'active')));

  //     if (transportData.length > 0) {
  //         const t = transportData[0];
  //         const rate = Number(t.rate);
  //         let discountAmount = 0;
  //         const transportTotal = t.durationMonths * rate;

  //         if (isFirstInvoice) { // Apply initial discount only on first invoice
  //             if (t.discountType === 'percentage') {
  //                 discountAmount = (rate * Number(t.discountValue)) / 100;
  //             } else if (t.discountType === 'amount') {
  //                 discountAmount = Number(t.discountValue);
  //             }
  //         }

  //         subTotal += transportTotal;
  //         totalDiscounts += discountAmount;
  //         invoiceItemsData.push({
  //             description: `Transportation - ${t.mode}`,
  //             itemType: 'transport_fee',
  //             durationMonths: t.durationMonths,
  //             discountType: `${t.discountType}`,
  //             discountValue: `${t.discountValue}`,
  //             unitPrice: rate.toFixed(2),
  //             total: (transportTotal - discountAmount).toFixed(2),
  //         });
  //     }

  //     if (invoiceItemsData.length === 0) {
  //         throw new Error("No items to invoice for this student.");
  //     }

  //     // Final Totals
  //     const totalAfterDiscount = subTotal - totalDiscounts;
  //     const vatAmount = totalAfterDiscount * 0.05;
  //     const grandTotal = totalAfterDiscount + vatAmount;

  //     // 6. Create Invoice
  //     const [newInvoice] = await tx.insert(invoices).values({
  //       invoiceNumber,
  //       studentId,
  //       issueDate: today.toISOString().split('T')[0],
  //       dueDate: new Date(today.getFullYear(), today.getMonth() + 1, 15).toISOString().split('T')[0], // Due 15th of next month
  //       amountPaid: "0.00",
  //       subTotal: subTotal.toFixed(2),
  //       discountAmount: totalDiscounts.toFixed(2),
  //       totalAmount: grandTotal.toFixed(2),
  //       vatAmount: vatAmount.toFixed(2),
  //       status: "unpaid",
  //     }).returning();

  //     // 7. Insert Invoice Items
  //     if (invoiceItemsData.length > 0) {
  //         await tx.insert(invoiceItems).values(
  //             invoiceItemsData.map(item => ({
  //                 ...item,
  //                 invoiceId: newInvoice.id,
  //             }))
  //         );
  //     }

  //     // Return both invoice and items
  //     return { invoice: newInvoice, items: invoiceItemsData };
  //   });
  // }

  async createManualInvoiceWithLogic(studentId: number, extraDiscount: number = 0) {
    return await db.transaction(async (tx) => {
      const today = new Date();

      const student = await tx.query.students.findFirst({
        where: eq(students.id, studentId),
      });

      if (!student || student.status !== 'active') {
        throw new Error(`Student with ID ${studentId} not found or is not active.`);
      }

      const existingInvoices = await tx
        .select({ id: invoices.id })
        .from(invoices)
        .where(eq(invoices.studentId, studentId))
        .limit(1);

      const isFirstOverallInvoice = existingInvoices.length === 0;

      const enrollmentData = await tx
        .select({
          courseName: courses.name,
          originalFee: courses.fee,
          discountType: studentCourseFee.discountType,
          discountValue: studentCourseFee.discountValue,
          monthOfYear: studentCourseFee.monthsOfYear,
        })
        .from(enrollments)
        .innerJoin(studentCourseFee, eq(enrollments.id, studentCourseFee.enrollmentId))
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .where(and(eq(enrollments.studentId, studentId), eq(enrollments.status, 'active')));

      if (enrollmentData.length === 0) {
        throw new Error("No active enrollments found to generate invoices.");
      }

      const enrollmentsByMonth: Record<string, typeof enrollmentData> = {};

      for (const enr of enrollmentData) {
        let monthsWithYears: string[] = [];

        try {
          const raw = enr.monthOfYear || '';

          // Convert from: {"January","February"} to ['January', 'February']
          monthsWithYears = raw
            .replace(/[{}"]/g, '') // remove braces and quotes
            .split(',')
            .map(m => m.trim())
            .filter(Boolean);
        } catch (err) {
          console.error("Failed to parse monthOfYear:", enr.monthOfYear);
          continue;
        }

        for (const monthWithYear of monthsWithYears) {
          if (!enrollmentsByMonth[monthWithYear]) {
            enrollmentsByMonth[monthWithYear] = [];
          }
          enrollmentsByMonth[monthWithYear].push(enr);
        }
      }

      const createdInvoices = [];
      let invoiceCounter = 0;

      for (const monthWithYear of Object.keys(enrollmentsByMonth)) {
        // console.log("📦 Raw month key:", monthWithYear);
        const isFirstInvoiceInThisRun = invoiceCounter === 0;

        let subTotal = 0;
        let totalDiscounts = 0;
        const invoiceItemsData: any[] = [];

        const currentMonthIndex = today.getMonth(); // 0-based (0 = Jan, 6 = July)
        const currentYear = today.getFullYear();

        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];

        // Inside the loop (for each `month` in `enrollmentsByMonth`)
        const [monthName, yearStr] = monthWithYear.trim().split(' ');
        const targetMonthIndex = monthNames.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
        const targetYear = parseInt(yearStr);

        if (targetMonthIndex === -1 || isNaN(targetYear)) {
          throw new Error(`Invalid month name or year: ${monthWithYear}`);
        }

        let issueDate: Date;

        // If the month is the same as current month, use today
        if (
          isFirstInvoiceInThisRun &&
          isFirstOverallInvoice &&
          targetMonthIndex === currentMonthIndex &&
          targetYear === currentYear
        ) {
          issueDate = today;
        } else {
          // Set issueDate to 1st of the target month
          // If target month is before current month, it must be for next year
          issueDate = new Date(targetYear, targetMonthIndex, 1);
        }
        const dueDate = new Date(issueDate.getFullYear(), issueDate.getMonth(), 10);

        const invoiceNumber = `INV-${format(issueDate, 'yyyyMMdd')}-${studentId}`;

        if (isFirstOverallInvoice && isFirstInvoiceInThisRun) {
          // A. Registration Fee
          if (student.registrationFee && Number(student.registrationFee) > 0) {
            const fee = Number(student.registrationFee);
            subTotal += fee;
            invoiceItemsData.push({
              description: 'Registration Fee',
              itemType: 'registration_fee',
              unitPrice: fee.toFixed(2),
              quantity: 1,
              total: fee.toFixed(2),
            });
          }

          // B. Inventory Items
          const inventoryData = await tx
            .select({
              name: inventory.items,
              quantity: studentInventory.quantity,
              amount: inventory.amount,
              discountValue: studentInventory.discountValue,
              discountType: studentInventory.discountType,
            })
            .from(studentInventory)
            .innerJoin(inventory, eq(studentInventory.inventoryId, inventory.id))
            .where(eq(studentInventory.studentId, studentId));

          for (const item of inventoryData) {
            const itemTotal = Number(item.amount) * item.quantity;
            let discountAmount = 0;
            if (item.discountType === 'amount') {
              discountAmount = Number(item.discountValue || 0);
            } else if (item.discountType === 'percentage' && item.discountValue) {
              discountAmount = (itemTotal * Number(item.discountValue)) / 100;
            }

            totalDiscounts += discountAmount;
            subTotal += itemTotal;
            invoiceItemsData.push({
              description: item.name,
              itemType: 'inventory_fee',
              discountType: item.discountType,
              discountValue: item.discountValue,
              quantity: item.quantity,
              unitPrice: itemTotal.toFixed(2),
              total: (itemTotal - discountAmount).toFixed(2),
            });
          }
        }

        const monthlyEnrollments = enrollmentsByMonth[monthWithYear];
        for (const enr of monthlyEnrollments) {
          const monthlyFee = Number(enr.originalFee);
          let discountAmount = 0;

          if (enr.discountType === 'percentage' && enr.discountValue) {
            discountAmount = (monthlyFee * Number(enr.discountValue)) / 100;
          } else if (enr.discountType === 'amount') {
            discountAmount = Number(enr.discountValue);
          }

          totalDiscounts += discountAmount;
          subTotal += monthlyFee;
          invoiceItemsData.push({
            description: `${enr.courseName}`,
            itemType: 'course_fee',
            discountType: enr.discountType,
            discountValue: enr.discountValue,
            unitPrice: monthlyFee.toFixed(2),
            quantity: 1,
            total: (monthlyFee - discountAmount).toFixed(2),
          });
        }

        const previousTransportInvoicesCount = await tx
          .select({ count: sql`COUNT(*)`.as('count') })
          .from(invoiceItems)
          .innerJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
          .where(
            and(
              eq(invoices.studentId, studentId),
              eq(invoiceItems.itemType, 'transport_fee')
            )
          )
          .then((res) => Number(res[0]?.count ?? 0));

        const transportData = await tx
          .select({
            mode: transportationMode.mode,
            rate: transportationMode.rate,
            discountType: transportation.discountType,
            discountValue: transportation.discountValue,
            durationMonths: transportation.durationMonths,
          })
          .from(transportation)
          .innerJoin(transportationMode, eq(transportation.modeId, transportationMode.id))
          .where(and(eq(transportation.studentId, studentId), eq(transportation.status, 'active')));

        if (transportData.length > 0) {
          const t = transportData[0];
          const rate = Number(t.rate);
          let discountAmount = 0;
          // const transportTotal = Number(t.durationMonths) * rate;
          const duration = Number(t.durationMonths);
          const transportTotal = rate;

          if (previousTransportInvoicesCount < duration) {
            if (t.discountType === 'percentage') {
              const splitPercentage = duration > 1
                ? Number(t.discountValue) / duration
                : Number(t.discountValue);
              discountAmount = (rate * splitPercentage) / 100;
            } else if (t.discountType === 'amount') {
              const splitAmount = duration > 1
                ? Number(t.discountValue) / duration
                : Number(t.discountValue);
              discountAmount = Number(splitAmount);
            }
          }

          subTotal += transportTotal;
          totalDiscounts += discountAmount;
          invoiceItemsData.push({
            description: `Transportation - ${t.mode}`,
            itemType: 'transport_fee',
            discountType: t.discountType,
            discountValue: discountAmount,
            unitPrice: rate.toFixed(2),
            quantity: 1,
            total: (transportTotal - discountAmount).toFixed(2),
          });
        }

        if (invoiceItemsData.length === 0) {
          console.warn(`No invoice items to generate for student ${studentId} for month ${monthWithYear}. Skipping.`);
          continue;
        }

        totalDiscounts = totalDiscounts + (isFirstOverallInvoice && isFirstInvoiceInThisRun ? extraDiscount : 0);
        const totalAfterDiscount = subTotal - totalDiscounts;
        const vatAmount = totalAfterDiscount * 0.05;
        const grandTotal = totalAfterDiscount;

        if (isFirstOverallInvoice && isFirstInvoiceInThisRun) {
          extraDiscount = Number(extraDiscount) || 0;
          if (extraDiscount > 0) {
            invoiceItemsData.push({
              description: 'Extra Discount',
              itemType: 'extra_discount',
              discountType: 'amount',
              discountValue: extraDiscount,
              unitPrice: extraDiscount,
              quantity: 1,
              total: extraDiscount.toFixed(2),
            });
          }
        }

        const [newInvoice] = await tx.insert(invoices).values({
          invoiceNumber,
          studentId,
          issueDate: format(issueDate, 'yyyy-MM-dd'),
          dueDate: format(dueDate, 'yyyy-MM-dd'),
          amountPaid: "0.00",
          subTotal: subTotal.toFixed(2),
          discountAmount: totalDiscounts.toFixed(2),
          extraDiscount: extraDiscount.toFixed(2),
          totalAmount: grandTotal.toFixed(2),
          vatAmount: vatAmount.toFixed(2),
          status: "unpaid",
        }).returning();

        await tx.insert(invoiceItems).values(
          invoiceItemsData.map(item => ({
            ...item,
            invoiceId: newInvoice.id,
          }))
        );

        createdInvoices.push(newInvoice);
        invoiceCounter++;
      }

      if (createdInvoices.length === 0) {
        throw new Error("No invoices were generated for this student.");
      }

      return createdInvoices;
    });
  }

  async createCurrentMonthInvoice(studentId: number) {
    return await db.transaction(async (tx) => {
      const today = new Date();
      const issueDate = new Date(today.getFullYear(), today.getMonth(), 1); // first day of current month
      const dueDate = new Date(today.getFullYear(), today.getMonth(), 10); // 10th day

      const student = await tx.query.students.findFirst({
        where: eq(students.id, studentId),
      });

      if (!student || student.status !== 'active') {
        throw new Error(`Student with ID ${studentId} not found or is not active.`);
      }

      const invoiceNumber = `INV-${format(issueDate, 'yyyyMMdd')}-${studentId}`;

      // Check if invoice already exists for this month
      const existingInvoice = await tx.query.invoices.findFirst({
        where: eq(invoices.invoiceNumber, invoiceNumber),
      });

      if (existingInvoice) {
        throw new Error(`Invoice already exists for ${format(issueDate, 'MMMM yyyy')}.`);
      }

      // Get all active enrollments (no month filtering)
      const enrollmentData = await tx
        .select({
          courseName: courses.name,
          originalFee: courses.fee,
          // skip discount fields here
        })
        .from(enrollments)
        .innerJoin(studentCourseFee, eq(enrollments.id, studentCourseFee.enrollmentId))
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .where(and(eq(enrollments.studentId, studentId), eq(enrollments.status, 'active')));

      if (enrollmentData.length === 0) {
        throw new Error(`No active enrollments found for student ${studentId}.`);
      }

      const isFirstInvoice = (await tx
        .select({ id: invoices.id })
        .from(invoices)
        .where(eq(invoices.studentId, studentId))
      ).length === 0;

      let subTotal = 0;
      const invoiceItemsData: any[] = [];

      // Registration fee if first invoice
      if (isFirstInvoice && student.registrationFee && Number(student.registrationFee) > 0) {
        const fee = Number(student.registrationFee);
        subTotal += fee;
        invoiceItemsData.push({
          description: 'Registration Fee',
          itemType: 'registration_fee',
          unitPrice: fee.toFixed(2),
          quantity: 1,
          total: fee.toFixed(2),
        });
      }

      // Inventory items if first invoice
      if (isFirstInvoice) {
        const inventoryData = await tx
          .select({
            name: inventory.items,
            quantity: studentInventory.quantity,
            amount: inventory.amount,
            // skip discount fields
          })
          .from(studentInventory)
          .innerJoin(inventory, eq(studentInventory.inventoryId, inventory.id))
          .where(eq(studentInventory.studentId, studentId));

        for (const item of inventoryData) {
          const itemTotal = Number(item.amount) * item.quantity;
          subTotal += itemTotal;
          invoiceItemsData.push({
            description: item.name,
            itemType: 'inventory_fee',
            quantity: item.quantity,
            unitPrice: item.amount?.toFixed(2),
            total: itemTotal.toFixed(2),
          });
        }
      }

      // Course fees without discount
      for (const enr of enrollmentData) {
        const monthlyFee = Number(enr.originalFee);
        subTotal += monthlyFee;

        invoiceItemsData.push({
          description: enr.courseName,
          itemType: 'course_fee',
          quantity: 1,
          unitPrice: monthlyFee.toFixed(2),
          total: monthlyFee.toFixed(2),
        });
      }

      // Transportation fees without discount
      const transportData = await tx
        .select({
          mode: transportationMode.mode,
          rate: transportationMode.rate,
          durationMonths: transportation.durationMonths,
        })
        .from(transportation)
        .innerJoin(transportationMode, eq(transportation.modeId, transportationMode.id))
        .where(and(eq(transportation.studentId, studentId), eq(transportation.status, 'active')));

      if (transportData.length > 0) {
        const t = transportData[0];
        const rate = Number(t.rate);
        const duration = Number(t.durationMonths);

        // Count how many transport invoices already issued
        const previousTransportInvoicesCount = await tx
          .select({ count: sql`COUNT(*)`.as('count') })
          .from(invoiceItems)
          .innerJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
          .where(
            and(
              eq(invoices.studentId, studentId),
              eq(invoiceItems.itemType, 'transport_fee')
            )
          )
          .then((res) => Number(res[0]?.count ?? 0));

        if (previousTransportInvoicesCount < duration) {
          subTotal += rate;
          invoiceItemsData.push({
            description: `Transportation - ${t.mode}`,
            itemType: 'transport_fee',
            quantity: 1,
            unitPrice: rate.toFixed(2),
            total: rate.toFixed(2),
          });
        }
      }

      if (invoiceItemsData.length === 0) {
        throw new Error(`No invoice items found for student ${studentId} for ${format(issueDate, 'MMMM yyyy')}.`);
      }

      const vatAmount = subTotal * 0.05;
      const grandTotal = subTotal; // no discounts, so total = subtotal

      const [newInvoice] = await tx.insert(invoices).values({
        invoiceNumber,
        studentId,
        issueDate: format(issueDate, 'yyyy-MM-dd'),
        dueDate: format(dueDate, 'yyyy-MM-dd'),
        amountPaid: "0.00",
        subTotal: subTotal.toFixed(2),
        discountAmount: "0.00", // no discount
        totalAmount: grandTotal.toFixed(2),
        vatAmount: vatAmount.toFixed(2),
        status: "unpaid",
      }).returning();

      await tx.insert(invoiceItems).values(
        invoiceItemsData.map(item => ({
          ...item,
          invoiceId: newInvoice.id,
        }))
      );

      return newInvoice;
    });
  }

  async cancelInvoice(invoiceId: number) {
    console.log(`Cancelling invoice with ID: ${invoiceId}`);
    
  // Update invoice status to 'cancelled'
  const result = await db
    .update(invoices)
    .set({ status: "cancelled" })
    .where(eq(invoices.id, invoiceId));
  
  return result; // returns number of rows affected
}

  // Employee methods
  async getEmployee(id: number): Promise<Employee | undefined> {
    const result = await db
      .select()
      .from(employees)
      .where(eq(employees.id, id));
    return result[0];
  }

  async getEmployeeByEmployeeId(
    employeeId: string
  ): Promise<Employee | undefined> {
    const result = await db
      .select()
      .from(employees)
      .where(eq(employees.employeeId, employeeId));
    return result[0];
  }

  async getEmployees(): Promise<Employee[]> {
    return await db.select().from(employees);
  }

  async getEmployeesByPosition(position: string): Promise<Employee[]> {
    return await db
      .select()
      .from(employees)
      .where(eq(employees.position, position));
  }

  async getEmployeesByBranch(branch: string): Promise<Employee[]> {
    return await db
      .select()
      .from(employees)
      .where(eq(employees.branch, branch));
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const result = await db
      .insert(employees)
      .values({
        ...employee,
        status: employee.status || "active",
        bankAccount: employee.bankAccount || null,
        createdAt: new Date(),
      })
      .returning();
    return result[0];
  }

  async updateEmployee(
    id: number,
    employee: Partial<Employee>
  ): Promise<Employee | undefined> {
    const result = await db
      .update(employees)
      .set(employee)
      .where(eq(employees.id, id))
      .returning();
    return result[0];
  }

  async deleteEmployee(id: number): Promise<boolean> {
    const result = await db
      .delete(employees)
      .where(eq(employees.id, id))
      .returning();
    return result.length > 0;
  }

  // Payroll methods
  async getPayroll(id: number): Promise<Payroll | undefined> {
    const result = await db.select().from(payrolls).where(eq(payrolls.id, id));
    return result[0];
  }

  async getPayrolls(): Promise<Payroll[]> {
    return await db.select().from(payrolls);
  }

  async getPayrollsByEmployee(employeeId: number): Promise<Payroll[]> {
    return await db
      .select()
      .from(payrolls)
      .where(eq(payrolls.employeeId, employeeId));
  }

  async getPayrollsByMonth(month: string): Promise<Payroll[]> {
    return await db.select().from(payrolls).where(eq(payrolls.month, month));
  }

  async createPayroll(payroll: InsertPayroll): Promise<Payroll> {
    const result = await db
      .insert(payrolls)
      .values({
        ...payroll,
        status: payroll.status || "pending",
        paymentDate: payroll.paymentDate || null,
        remarks: payroll.remarks || null,
        incentives: payroll.incentives || null,
        deductions: payroll.deductions || null,
        createdAt: new Date(),
      })
      .returning();
    return result[0];
  }

  async updatePayroll(
    id: number,
    payroll: Partial<Payroll>
  ): Promise<Payroll | undefined> {
    const result = await db
      .update(payrolls)
      .set(payroll)
      .where(eq(payrolls.id, id))
      .returning();
    return result[0];
  }

  async deletePayroll(id: number): Promise<boolean> {
    const result = await db
      .delete(payrolls)
      .where(eq(payrolls.id, id))
      .returning();
    return result.length > 0;
  }

  // Message methods
  async getMessage(id: number): Promise<Message | undefined> {
    const result = await db.select().from(messages).where(eq(messages.id, id));
    return result[0];
  }

  async getMessages(): Promise<Message[]> {
    return await db.select().from(messages);
  }

  async getMessagesBySender(senderId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.senderId, senderId));
  }

  async getMessagesByReceiver(receiverId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.receiverId, receiverId));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await db
      .insert(messages)
      .values({
        ...message,
        sentAt: new Date(),
        readAt: null,
        status: "unread",
      })
      .returning();
    return result[0];
  }

  async updateMessage(
    id: number,
    message: Partial<Message>
  ): Promise<Message | undefined> {
    const result = await db
      .update(messages)
      .set(message)
      .where(eq(messages.id, id))
      .returning();
    return result[0];
  }

  async deleteMessage(id: number): Promise<boolean> {
    const result = await db
      .delete(messages)
      .where(eq(messages.id, id))
      .returning();
    return result.length > 0;
  }

  // Branch methods
  async getBranch(id: number): Promise<Branch & { branchBrands: BranchBrand[] } | undefined> {
    const result = await db.select().from(branches).where(eq(branches.id, id));
    const branchBrandsResult = await db.select().from(branchBrands).where(eq(branchBrands.branchId, id));
    return {
      ...result[0],
      branchBrands: branchBrandsResult,
    };
  }

  async getBranches(): Promise<(Branch & { brandIds: number[] })[]> {
    const branchesResult = await db.select().from(branches);
    const branchBrandsResult = await db.select().from(branchBrands);

    return branchesResult.map(branch => ({
      ...branch,
      brandIds: branchBrandsResult
        .filter(bb => bb.branchId === branch.id)
        .map(bb => bb.brandId),
    }));
  }

  async getBranchByName(name: string): Promise<Branch | undefined> {
    const result = await db
      .select()
      .from(branches)
      .where(eq(branches.name, name));
    return result[0];
  }

  async createBranch(branch: InsertBranch): Promise<Branch> {
    const result = await db.insert(branches).values({
      ...branch,
      // brandId: Number(branch.brandId),
      status: branch.status || "active",
      manager: branch.manager || null,
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  async updateBranch(id: number, branch: Partial<Branch>): Promise<Branch | undefined> {
    const result = await db.update(branches)
      .set(branch)
      .where(eq(branches.id, id))
      .returning();
    return result[0];
  }

  async deleteBranch(id: number): Promise<boolean> {
    const result = await db
      .delete(branches)
      .where(eq(branches.id, id))
      .returning();
    return result.length > 0;
  }

  // Branch-brand methods
  async getBranchBrands(): Promise<BranchBrand[]> {
    return await db.select().from(branchBrands);
  }

  async createBranchBrand(data: InsertBranchBrand): Promise<BranchBrand> {
    const result = await db
      .insert(branchBrands)
      .values({ ...data, createdAt: new Date() })
      .returning();
    return result[0];
  }

  async deleteBranchBrand(branchId: number): Promise<boolean> {
    const result = await db
      .delete(branchBrands)
      .where(and(eq(branchBrands.branchId, branchId)))
      .returning();
    return result.length > 0;
  }

  //  Student Payment methods
  async createStudentPayment(data: InsertStudentPayment): Promise<StudentPayment> {
    const result = await db
      .insert(studentPayments)
      .values({ ...data, createdAt: new Date() })
      .returning();
    return result[0];
  }

  async getStudentPayments(): Promise<StudentPayment[]> {
    return await db.select().from(studentPayments);
  }

  async getStudentPayment(id: number): Promise<StudentPayment | undefined> {
    const result = await db.select().from(studentPayments).where(eq(studentPayments.id, id));
    return result[0];
  }

  async updateStudentPayment(id: number, data: Partial<InsertStudentPayment>): Promise<StudentPayment | undefined> {
    const result = await db.update(studentPayments).set(data).where(eq(studentPayments.id, id)).returning();
    return result[0];
  }

  async deleteStudentPayment(id: number): Promise<boolean> {
    const result = await db
      .delete(studentPayments)
      .where(eq(studentPayments.id, id))
      .returning();
    return result.length > 0;
  }

  async generatePaymentId(): Promise<string> {
    const result = await db
      .select({ paymentId: studentPayments.paymentId })
      .from(studentPayments)
      .orderBy(desc(studentPayments.paymentId))
      .limit(1);

    let nextNumber = 101;

    if (result.length > 0) {
      const match = result[0].paymentId.match(/PAY-(\d+)/);
      if (match) {
        const lastNumber = parseInt(match[1], 10);
        nextNumber = lastNumber + 1;
      }
    }

    return `PAY-${nextNumber}`;
  }

  async generateReceiptId(): Promise<string> {
    const result = await db
      .select({ receiptNumber: receipts.receiptNumber })
      .from(receipts)
      .orderBy(desc(receipts.receiptNumber))
      .limit(1);

    let nextNumber = 101;

    if (result.length > 0) {
      const match = result[0].receiptNumber.match(/REC-(\d+)/);
      if (match) {
        const lastNumber = parseInt(match[1], 10);
        nextNumber = lastNumber + 1;
      }
    }

    return `REC-${nextNumber}`;
  }

  async getInvoicesByStudent(studentId: number): Promise<Invoice[]> {
    const result = await db
      .select()
      .from(invoices)
      .where(eq(invoices.studentId, studentId));
    return result;
  }

  async getUnpaidInvoices(): Promise<{ studentId: number; invoiceNumber: string; totalAmount: number }[]> {
    const result = await db
      .select({
        studentId: invoices.studentId,
        invoiceNumber: invoices.invoiceNumber,
        totalAmount: sql<number>`invoices.total_amount::int`
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.status, 'unpaid'),
        )
      );

    return result;
  }

  async getUnpaidInvoicesByStudent(studentId: number): Promise<{ studentId: number; invoiceNumber: string; totalAmount: number }[]> {
    const result = await db
      .select({
        studentId: invoices.studentId,
        invoiceNumber: invoices.invoiceNumber,
        totalAmount: sql<number>`invoices.total_amount-invoices.amount_paid`
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.studentId, studentId),
          or(eq(invoices.status, 'unpaid'), eq(invoices.status, 'partially_paid'))
        )
      );

    return result;
  }

  async getStudentsWithInvoices(studentIds: number[], month: number, year: number): Promise<number[]> {
    // Use raw SQL for EXTRACT(MONTH) and EXTRACT(YEAR)
    const rows = await db
      .select({
        studentId: invoices.studentId,
      })
      .from(invoices)
      .where(
        and(
          inArray(invoices.studentId, studentIds),
          sql`EXTRACT(MONTH FROM ${invoices.issueDate}) = ${month}`,
          sql`EXTRACT(YEAR FROM ${invoices.issueDate}) = ${year}`
        )
      )
      .groupBy(invoices.studentId);

    return rows.map(row => row.studentId);
  }

  // async getOutstandingSummary(studentId: number): Promise<{total: number; paid: number; outstandingAmount: number }> {
  //   const result = await db
  //     .select({
  //       total: sql<number>`SUM(${invoices.totalAmount})`,
  //       paid: sql<number>`SUM(${invoices.amountPaid})`,
  //       outstandingAmount: sql<number>`SUM(${invoices.totalAmount}) - SUM(${invoices.amountPaid})`
  //     })
  //     .from(invoices)
  //     .where(
  //       and(
  //         eq(invoices.studentId, studentId),
  //         // or(eq(invoices.status, 'unpaid'), eq(invoices.status, 'partially_paid'))
  //       )
  //     );

  //   return result[0];
  // }

  async getOutstandingSummary(studentId: number): Promise<{ total: number; paid: number; outstandingAmount: number; creditAmount: number }> {
    const invoiceData = await db
      .select({
        totalAmount: sql<number>`SUM(${invoices.totalAmount})`,
        amountPaid: sql<number>`SUM(${invoices.amountPaid})`,
      })
      .from(invoices)
      .where(eq(invoices.studentId, studentId))
      .then((res) => res[0]);

    // 2. Get credit note totals of account type
    const creditData = await db
      .select({
        creditAmount: sql<number>`SUM(${creditNotes.amount})`,
      })
      .from(creditNotes)
      .where(
        and(
          eq(creditNotes.studentId, studentId),
          eq(creditNotes.appliedToType, "own account")
        )
      )
      .then((res) => res[0]);

    // 3. Compute values safely
    const totalAmount = invoiceData?.totalAmount ?? 0;
    const amountPaid = invoiceData?.amountPaid ?? 0;
    const creditAmount = creditData?.creditAmount ?? 0;

    const outstandingAmount = totalAmount - amountPaid - creditAmount;

    // 4. Return final result
    return {
      total: totalAmount,
      paid: amountPaid,
      creditAmount,
      outstandingAmount,
    };
  }

  // Payment item methods
  async getPaymentItems(): Promise<PaymentItem[]> {
    return await db.select().from(paymentItems);
  }

  async getPaymentItem(id: number): Promise<PaymentItem | undefined> {
    const result = await db
      .select()
      .from(paymentItems)
      .where(eq(paymentItems.id, id));
    return result[0];
  }

  async createPaymentItem(paymentItem: InsertPaymentItem): Promise<PaymentItem> {
    const result = await db
      .insert(paymentItems)
      .values({
        ...paymentItem,
        createdAt: new Date(),
      })
      .returning();
    return result[0];
  }

  // Receipt methods
  async getReceipts(): Promise<Receipt[]> {
    return await db.select().from(receipts);
  }

  async getReceipt(id: number): Promise<Receipt | undefined> {
    const result = await db
      .select()
      .from(receipts)
      .where(eq(receipts.id, id));
    return result[0];
  }

  // async getReceiptByReceiptNumber(receiptNumber: string): Promise<Receipt | undefined> {
  //   const result = await db
  //     .select()
  //     .from(receipts)
  //     .where(eq(receipts.receiptNumber, receiptNumber));
  //   return result[0];
  // }

  async getReceiptByReceiptNumber(receiptNumber: string) {
    const result = await db
      .select({
        receipt: receipts,
        // firstName: students.firstName,
        // middleName: students.middleName,
        // lastName: students.lastName,
        student: students
      })
      .from(receipts)
      .innerJoin(studentPayments, eq(receipts.paymentId, studentPayments.paymentId))
      .innerJoin(students, eq(studentPayments.studentId, students.id))
      .where(eq(receipts.receiptNumber, receiptNumber));

    const { receipt, student } = result[0];

    const fullName = `${student.firstName} ${student.middleName || ""} ${student.lastName}`.trim().replace(/\s+/g, ' ');

    return {
      ...receipt,
      studentName: fullName,
    };
  }

  async createReceipt(receipt: InsertReceipt): Promise<Receipt> {
    const result = await db
      .insert(receipts)
      .values({
        ...receipt,
        createdAt: new Date(),
      })
      .returning();
    return result[0];
  }

  // Credit notes
  async getCreditNotes(): Promise<CreditNote[]> {
    return await db.select().from(creditNotes);
  }

  async getCreditNote(id: number): Promise<CreditNote | undefined> {
    const result = await db.select().from(creditNotes).where(eq(creditNotes.id, id));
    return result[0];
  }

  async getCreditNoteByCreditNoteNumber(creditNoteNumber: string) {
    const result = await db
      .select({
        creditNote: creditNotes,
        // firstName: students.firstName,
        // middleName: students.middleName,
        // lastName: students.lastName,
        student: students,
        invoice: invoices
      })
      .from(creditNotes)
      .innerJoin(students, eq(creditNotes.studentId, students.id))
      .leftJoin(invoices, eq(creditNotes.appliedInvoiceId, invoices.id))
      .where(eq(creditNotes.creditNoteNumber, creditNoteNumber));

    if (!result || result.length === 0) {
      throw new Error("No data returned — result is empty or undefined.");
    }

    const { creditNote, student, invoice } = result[0];

    const fullName = `${student.firstName} ${student.middleName || ""} ${student.lastName}`.trim().replace(/\s+/g, ' ');

    return {
      ...creditNote,
      studentName: fullName,
      invoiceNumber: invoice ? invoice.invoiceNumber : "-",
    };
  }

  async getCreditNotesByParentId(parentId: number, statuses?: string[]) {
    const whereClause = [
      eq(students.parentId, parentId),
      statuses && statuses.length > 0 ? inArray(creditNotes.status, statuses) : undefined,
    ].filter(Boolean);

    const result = await db
      .select({
        creditNotes: creditNotes,
        studentId: students.studentId,
        firstName: students.firstName,
        middleName: students.middleName,
        lastName: students.lastName,
        invoiceNumber: invoices.invoiceNumber,
      })
      .from(creditNotes)
      .innerJoin(students, eq(creditNotes.studentId, students.id))
      .leftJoin(invoices, eq(creditNotes.appliedInvoiceId, invoices.id))
      .where(and(...whereClause))
      .orderBy(creditNotes.id);

    return result;
  }

  async createCreditNote(creditNote: InsertCreditNote): Promise<CreditNote> {
    // 1. Get the latest creditNoteNumber (ordered by created date or ID)
    const lastCreditNote = await db
      .select()
      .from(creditNotes)
      .orderBy(desc(creditNotes.id)) // or use createdAt if needed
      .limit(1);

    // 2. Generate next number
    let nextNumber = 101; // default start
    if (lastCreditNote.length > 0 && lastCreditNote[0].creditNoteNumber) {
      const lastNumber = parseInt(
        lastCreditNote[0].creditNoteNumber.replace("CN-", "")
      );
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    const creditNoteNumber = `CN-${nextNumber}`;

    // 3. Insert new credit note
    const result = await db
      .insert(creditNotes)
      .values({
        ...creditNote,
        appliedInvoiceId: creditNote.appliedToType === 'against invoice' && creditNote.appliedInvoiceId
          ? creditNote.appliedInvoiceId
          : null,
        creditNoteNumber,
        createdAt: new Date(),
      })
      .returning();

    return result[0];
  }
}