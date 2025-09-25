import { pgTable, text, serial, integer, boolean, date, time, timestamp, decimal, primaryKey, bigint, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("parent"), // admin, teacher, parent, student
  phone: text("phone"),
  address: text("address"),
  branch: text("branch"),
  // profilePicture: text("profile_picture"),
  createdAt: timestamp("created_at").defaultNow(),
  resetToken: text("reset_token"),
  resetTokenExpires: timestamp("reset_token_expires"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  role: true,
  phone: true,
  address: true,
  branch: true,
  // profilePicture: true,
});

export const roles = pgTable("roles", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  permissions: jsonb("permissions").default({}),
});

export const insertRoleSchema = createInsertSchema(roles).pick({
  name: true,
  permissions: true,
});

// Department model
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  brandId: integer("brand_id").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDepartmentSchema = createInsertSchema(departments).pick({
  name: true,
  brandId: true,
  description: true,
});

// Schedule model
export const schedules = pgTable("schedule", {
  id: serial("id").primaryKey(),
  day: text("day").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  batchId: integer("batch_id").notNull(),
  duration: integer("duration").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertScheduleSchema = createInsertSchema(schedules, {
  startTime: z.string(),
  endTime: z.string(),
}).pick({
  day: true,
  startTime: true,
  endTime: true,
  batchId: true,
  duration: true,
});

// studio model
export const studio = pgTable("studio", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
});

export const insertStudioSchema = createInsertSchema(studio).pick({
  name: true,
  description: true,
});

// Course model
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  brandId: integer("brand_id").notNull(),
  category: text("category").notNull(), // music, dance, art
  fee: decimal("fee", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCourseSchema = createInsertSchema(courses).pick({
  name: true,
  code: true,
  brandId: true,
  category: true,
  fee: true,
});

// Batch model
export const batches = pgTable("batches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  courseId: integer("course_id").notNull(),
  teacherId: integer("teacher_id").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  roomNumber: text("room_number"),
  capacity: integer("capacity").notNull(),
  category: text("category").notNull(),
  branch: text("branch").notNull(),
  perDayValue: decimal("per_day_value", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("active"), // active, completed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
});

// Custom Zod schema for batch name validation
// export const batchNameSchema = z.string().refine((val) => {
//   // Format: CCBBSSYY (CC=Course Code, BB=Branch Code, SS=Serial, YY=Year)
//   const regex = /^[A-Z]{2}[A-Z]{2}\d{2}\d{2}$/;
//   return regex.test(val);
// }, "Batch name must follow format: CCBBSSYY (Course Code + Branch Code + Serial + Year)");

export const insertBatchSchema = createInsertSchema(batches).pick({
  name: true,
  courseId: true,
  teacherId: true,
  startDate: true,
  endDate: true,
  roomNumber: true,
  capacity: true,
  category: true,
  branch: true,
  perDayValue: true,
  status: true,
}).extend({
  endDate: z.string().nullable(), // Allow null for end date
});

// Student model
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").notNull().unique(),
  firstName: text("first_name").notNull(),
  middleName: text("middle_name"),
  lastName: text("last_name").notNull(),
  // username: text("username").notNull().unique(),
  // password: text("password"),
  dateOfBirth: date("date_of_birth").notNull(),
  age: integer("age").notNull(),
  gender: text("gender"),
  parentId: integer("parent_id").notNull(),
  userId: integer("user_id"),
  street: text("street"),
  community: text("community"),
  residenceAddress: text("residence_address"),
  flatNo: text("flat_no"),
  phone: text("phone").notNull(),
  whatsappNo: text("whatsapp_no"),
  email: text("email"),
  isReRegistering: text("is_re_registering").default("no"),
  registrationDate: date("registration_date"),
  registrationFee: decimal("registration_fee", { precision: 10, scale: 2 }).default("0"),
  status: text("status").default("active"),
  branch: text("branch"),  // Store as comma-separated values e.g. "1,2,3"
  course: text("course"),  // Store as comma-separated values e.g. "1,2,10"
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStudentSchema = createInsertSchema(students).pick({
  studentId: true,
  firstName: true,
  middleName: true,
  lastName: true,
  dateOfBirth: true,
  age: true,
  gender: true,
  parentId: true,
  userId: true,
  // username: true,
  // password: true,
  street: true,
  community: true,
  residenceAddress: true,
  flatNo: true,
  phone: true,
  whatsappNo: true,
  email: true,
  isReRegistering: true,
  registrationDate: true,
  registrationFee: true,
  status: true,
  branch: true,
  course: true,
});

// Parent model
export const parents = pgTable("parents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  firstName: text("first_name").notNull(),
  middleName: text("middle_name"),
  lastName: text("last_name").notNull(),
  username: text("username").notNull().unique(),
  password: text("password"),
  // relationToStudent: text("relation_to_student").notNull(),
  phone: text("phone"),
  whatsappNo: text("whatsapp_no"),
  email: text("email"),
  street: text("street"),
  community: text("community"),
  residenceAddress: text("residence_address"),
  flatNo: text("flat_no"),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertParentSchema = createInsertSchema(parents).pick({
  userId: true,
  firstName: true,
  middleName: true,
  lastName: true,
  username: true,
  password: true,
  // relationToStudent: true,
  phone: true,
  whatsappNo: true,
  email: true,
  street: true,
  community: true,
  residenceAddress: true,
  flatNo: true,
  status: true,
});

// Enrollment model
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id).notNull(),
  courseId: integer("course_id").notNull(),
  batchId: integer("batch_id").notNull(),
  branchId: integer("branch_id").notNull(),
  enrollmentDate: date("enrollment_date").defaultNow(),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).pick({
  studentId: true,
  courseId: true,
  batchId: true,
  branchId: true,
  enrollmentDate: true,
  status: true,
  createdAt: true,
});

//Transportation model
export const transportation = pgTable("transportation", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => students.id).notNull(),
  transportationNeeded: boolean("transportation_needed").default(false),
  modeId: integer("mode_id").references(() => transportationMode.id).notNull(),
  durationMonths: integer("duration_months").notNull().default(1),
  pickingPoint: text("picking_point"),
  droppingPoint: text("dropping_point"),
  contactPerson: text("contact_person"),
  pickUpTime: time("pick_up_time"),
  dropOffTime: time("drop_off_time"),
  address: text("address"),
  discountType: text("discount_type").default("amount"),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).default("0"),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTransportationSchema = createInsertSchema(transportation).pick({
  studentId: true,
  transportationNeeded: true,
  modeId: true,
  durationMonths: true,
  pickingPoint: true,
  droppingPoint: true,
  contactPerson: true,
  pickUpTime: true,
  dropOffTime: true,
  address: true,
  discountType: true,
  discountValue: true,
  totalAmount: true,
  status: true,
  createdAt: true,
});

// Transportation mode
export const transportationMode = pgTable("transportation_mode", {
  id: serial("id").primaryKey(),
  mode: text("mode").notNull(),
  rate: integer("rate").notNull(),
  perDayValue: decimal("per_day_value", { precision: 10, scale: 2 }).notNull(),
});

export const insertTransportationModeSchema = createInsertSchema(transportationMode).pick({
  mode: true,
  rate: true,
  perDayValue: true,
});

// Inventory model
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  items: text("items"),
  amount: integer("amount"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInventorySchema = createInsertSchema(inventory).pick({
  items: true,
  amount: true,
});

// Student Inventory
export const studentInventory = pgTable("student_inventory", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  inventoryId: integer("inventory_id").notNull(),
  quantity: integer("quantity").notNull(),
  discountType: text("discount_type").default("amount"),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStudentInventorySchema = createInsertSchema(studentInventory).pick({
  studentId: true,
  inventoryId: true,
  quantity: true,
  discountType: true,
  discountValue: true,
  totalAmount: true,
});

// Fee Structure
export const studentCourseFee = pgTable("student_course_fee", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").notNull().references(() => enrollments.id),
  durationMonths: integer("duration_months").notNull(),
  monthsOfYear: text("months_of_year").notNull(),
  discountType: text("discount_type").default("amount"),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).default("0"),
  totalFee: decimal("total_fee", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStudentCourseFeeSchema = createInsertSchema(studentCourseFee).pick({
  enrollmentId: true,
  durationMonths: true,
  monthsOfYear: true,
  discountType: true,
  discountValue: true,
  totalFee: true,
});

// Student Enrollment Fees
export const studentEnrollmentFees = pgTable("student_enrollment_fees", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id),
  totalEnrollmentFee: decimal("total_enrollment_fee", { precision: 10, scale: 2 }).default("0"),
  enrollmentDiscountType: text("enrollment_discount_type").default("amount"), // 'amount' | 'percentage'
  enrollmentDiscountValue: decimal("enrollment_discount_value", { precision: 10, scale: 2 }).default("0"),
  totalTransportFee: decimal("total_transport_fee", { precision: 10, scale: 2 }).default("0"),
  transportDiscountType: text("transport_discount_type").default("amount"),
  transportDiscountValue: decimal("transport_discount_value", { precision: 10, scale: 2 }).default("0"),
  totalInventoryFee: decimal("total_inventory_fee", { precision: 10, scale: 2 }).default("0"),
  inventoryDiscountType: text("inventory_discount_type").default("amount"),
  inventoryDiscountValue: decimal("inventory_discount_value", { precision: 10, scale: 2 }).default("0"),
  totalPayable: decimal("total_payable", { precision: 10, scale: 2 }).default("0"),
  totalDiscount: decimal("total_discount", { precision: 10, scale: 2 }).default("0"),
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).default("0"),
  grandTotal: decimal("grand_total", { precision: 10, scale: 2 }).default("0"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStudentEnrollmentFeesSchema = createInsertSchema(studentEnrollmentFees).pick({
  studentId: true,
  totalEnrollmentFee: true,
  enrollmentDiscountType: true,
  enrollmentDiscountValue: true,
  totalTransportFee: true,
  transportDiscountType: true,
  transportDiscountValue: true,
  totalInventoryFee: true,
  inventoryDiscountType: true,
  inventoryDiscountValue: true,
  totalPayable: true,
  totalDiscount: true,
  vatAmount: true,
  grandTotal: true,
});

// Attendance model
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id),
  batchId: integer("batch_id").notNull().references(() => batches.id),
  date: date("date").notNull(),
  status: text("status").notNull(),
  compensationBatchName: text("compensation_batch_name"),
  compensationDate: date("compensation_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAttendanceSchema = createInsertSchema(attendance).pick({
  studentId: true,
  batchId: true,
  date: true,
  status: true,
  compensationBatchName: true,
  compensationDate: true,
});

// Leave Request model
export const leaveRequests = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: text("status").notNull(), // pending, approved, rejected
  documents: text("documents"), // URLs to uploaded documents
  refundEligible: boolean("refund_eligible").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLeaveRequestSchema = createInsertSchema(leaveRequests).pick({
  enrollmentId: true,
  startDate: true,
  endDate: true,
  status: true,
  documents: true,
  refundEligible: true,
});

// Compensation Class model
export const compensationClasses = pgTable("compensation_classes", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").notNull(),
  originalBatchId: text("original_batch_id").notNull(),
  compensationBatchId: text("compensation_batch_id").notNull(),
  missedDate: date("missed_date").notNull(),
  compensationDate: date("compensation_date").notNull(),
  status: text("status").notNull(), // pending, completed, expired
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCompensationClassSchema = createInsertSchema(compensationClasses).pick({
  enrollmentId: true,
  originalBatchId: true,
  compensationBatchId: true,
  missedDate: true,
  compensationDate: true,
  status: true,
});

// Compensation Requests model
export const compensationRequests = pgTable("compensation_requests", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  originalBatchId: integer("original_batch_id").notNull(),
  compensationBatchId: integer("compensation_batch_id").notNull(),
  originalClassDate: date("original_class_date").notNull(),
  requestedCompensationDate: date("requested_compensation_date").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected, completed
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCompensationRequestSchema = createInsertSchema(compensationRequests).pick({
  studentId: true,
  originalBatchId: true,
  compensationBatchId: true,
  originalClassDate: true,
  requestedCompensationDate: true,
  status: true,
  remarks: true,
});

// Payment model
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  invoiceId: text("invoice_id").notNull().unique(), // e.g., INV-20230715
  studentId: integer("student_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: date("payment_date").notNull(),
  dueDate: date("due_date").notNull(),
  status: text("status").notNull(), // paid, pending, failed, cancelled
  paymentMethod: text("payment_method"), // cash, card, bank transfer
  remarks: text("remarks"), 
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(payments).pick({
  invoiceId: true,
  studentId: true,
  amount: true,
  paymentDate: true,
  dueDate: true,
  status: true,
  paymentMethod: true,
  remarks: true,
});

// Employee model
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").notNull().unique(), 
  firstName: text("first_name").notNull(),
  middleName: text("middle_name"),
  lastName: text("last_name").notNull(),
  email: text("email"),
  userId: integer("user_id").notNull(),
  position: text("position").notNull(), // teacher, admin, staff
  userName:text("user_name").notNull(),
  password:text("password").notNull(),
  joiningDate: date("joining_date").notNull(),
  phoneNumber: bigint("phone_number", { mode: "number" }).notNull(),
  whatsappNumber: bigint("whatsapp_number", { mode: "number" }).notNull(),
  salary: decimal("salary", { precision: 10, scale: 2 }).notNull(),
  bankAccount: text("bank_account"),
  status: text("status").notNull().default("active"), // active, inactive
  branch: text("branch").notNull(),
  residenceAddress:text("residence_address").notNull(),
  street:text("street"),
  community:text("community"),
  flatNumber:text("flat_number"),
  ifscIbanBsb:text("IFSC_IBAN_BSB"),
  specialization: text("specialization"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEmployeeSchema = createInsertSchema(employees).pick({
  employeeId: true,
  firstName: true,
  middleName:true,
  lastName:true,
  email: true,
  userId: true,
  position: true,
  userName:true,
  password:true,
  joiningDate: true,
  phoneNumber:true,
  whatsappNumber:true,
  bankAccount: true,
  status: true,
  branch: true,
  residenceAddress:true,
  street:true,
  community:true,
  flatNumber:true,
  ifscIbanBsb:true,
  salary:true,
  specialization: true,
});

// Payroll model
export const payrolls = pgTable("payrolls", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull(),
  month: text("month").notNull(), // e.g., 2023-07
  basicSalary: decimal("basic_salary", { precision: 10, scale: 2 }).notNull(),
  incentives: decimal("incentives", { precision: 10, scale: 2 }).default("0"),
  deductions: decimal("deductions", { precision: 10, scale: 2 }).default("0"),
  netSalary: decimal("net_salary", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, processed, paid
  paymentDate: date("payment_date"),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPayrollSchema = createInsertSchema(payrolls).pick({
  employeeId: true,
  month: true,
  basicSalary: true,
  incentives: true,
  deductions: true,
  netSalary: true,
  status: true,
  paymentDate: true,
  remarks: true,
});

// Message model
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  content: text("content").notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
  readAt: timestamp("read_at"),
  status: text("status").notNull().default("sent"), // sent, delivered, read
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  senderId: true,
  receiverId: true,
  content: true,
});

// Branch model
export const branches = pgTable("branches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  code: text("code").notNull().unique(),
  // brandId: integer("brand_id").notNull(),
  // address: text("address").notNull(),
  phone: text("phone").notNull(),
  // email: text("email"),
  manager: text("manager"),
  status: text("status").notNull().default("active"), // active, inactive
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBranchSchema = createInsertSchema(branches).pick({
  name: true,
  code: true,
  // brandId: true,
  // address: true,
  phone: true,
  // email: true,
  manager: true,
  status: true,
});

// Brand model
export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBrandSchema = createInsertSchema(brands).pick({
  name: true,
  description: true,
});

export const branchBrands = pgTable("branch_brands", {
  branchId: integer("branch_id")
    .notNull()
    .references(() => branches.id),
  brandId: integer("brand_id")
    .notNull()
    .references(() => brands.id),
    createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.branchId, table.brandId] })
}));

export const insertBranchBrandSchema = createInsertSchema(branchBrands).pick({
  branchId: true,
  brandId: true,
});

// Credit Note model
export const creditNotes = pgTable("credit_notes", {
  id: serial("id").primaryKey(),
  creditNoteNumber: text("credit_note_number").notNull().unique(),
  studentId: integer("student_id").notNull().references(() => students.id),
  appliedInvoiceId: integer("applied_invoice_id").references(() => invoices.id),
  appliedToType: text("applied_to_type"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  generatedMonth: text("generated_month").notNull(),
  reason: text("reason"),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCreditNoteSchema = createInsertSchema(creditNotes).pick({
  studentId: true,
  appliedInvoiceId: true,
  appliedToType: true,
  amount: true,
  generatedMonth: true,
  reason: true,
  status: true,
});

// Invoice Model
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id),
  invoiceNumber: text("invoice_number").notNull().unique(),
  subTotal: decimal("sub_total", { precision: 10, scale: 2 }).notNull(),
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).default("0"),
  issueDate: date("issue_date").notNull(),
  dueDate: date("due_date").notNull(),
  status: text("status").default("unpaid"), // unpaid, partially_paid, paid
  extraDiscount: decimal("extra_discount", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).pick({
  studentId: true,
  invoiceNumber: true,
  subTotal: true,
  vatAmount: true,
  discountAmount: true,
  totalAmount: true,
  amountPaid: true,
  issueDate: true,
  dueDate: true,
  status: true,
  extraDiscount: true,
});

// InvoiceItems Model
export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  description: text("description").notNull(),
  itemType: text("item_type"), // 'course_fee', 'transport_fee', 'credit_note_adj'
  quantity: integer("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).default("0"),
  discountType: text("discount_type").default("amount"), // 'amount' | 'percentage'
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).pick({
  invoiceId: true,
  description: true,
  itemType: true,
  quantity: true,
  unitPrice: true,
  discountValue: true,
  discountType: true,
  total: true,
});

export const studentPayments = pgTable("student_payments", {
  id: serial("id").primaryKey(),
  paymentId: text("payment_id").notNull().unique(),
  studentId: integer("student_id").notNull().references(() => students.id),
  invoiceNumber: text("invoice_number").references(() => invoices.invoiceNumber),
  invoiceAmount: decimal("invoice_amount", { precision: 10, scale: 2 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: date("payment_date").notNull(),
  paymentMethod: text("payment_method").notNull(),
  remarks: text("remarks"),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  advanceAmount: decimal("advance_amount", { precision: 10, scale: 2 }).default("0"),
  state: text("state").notNull().default("active"),
});

export const insertStudentPaymentSchema = createInsertSchema(studentPayments).pick({
  paymentId: true,
  studentId: true,
  invoiceNumber: true,
  invoiceAmount: true,
  amount: true,
  paymentDate: true,
  paymentMethod: true,
  remarks: true,
  status: true,
  advanceAmount: true,
  state: true,
});

// Payment Items
export const paymentItems = pgTable("payment_items", {
  id: serial("id").primaryKey(),
  paymentId: text("payment_id").notNull().references(() => studentPayments.paymentId),
  invoiceNumber: text("invoice_number").references(() => invoices.invoiceNumber),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPaymentItemSchema = createInsertSchema(paymentItems).pick({
  paymentId: true,
  invoiceNumber: true,
  amount: true,
});

// Receipt Model
export const receipts = pgTable("receipts", {
  id: serial("id").primaryKey(),
  receiptNumber: text("receipt_number").notNull().unique(),
  paymentId: text("payment_id").notNull().references(() => studentPayments.paymentId),
  receiptDate: date("receipt_date").notNull(),
  invoiceDate: date("invoice_date").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertReceiptSchema = createInsertSchema(receipts).pick({
  receiptNumber: true,
  paymentId: true,
  receiptDate: true,
  invoiceDate: true,
  amount: true,
  paymentMethod: true,
  remarks: true,
});

// Item Stock Model
export const stockItem = pgTable("stock_item", {
  id: serial("id").primaryKey(),
  stockItemId: integer("stock_item_id").notNull().references(() => inventory.id),
  stockQuantity: integer("stock_quantity").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertStockItemSchema = createInsertSchema(stockItem).pick({
  stockItemId: true,
  stockQuantity: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type Batch = typeof batches.$inferSelect;
export type InsertBatch = z.infer<typeof insertBatchSchema>;

export type Studio = typeof studio.$inferSelect;
export type InsertStudio = z.infer<typeof insertStudioSchema>;

export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;

export type Parent = typeof parents.$inferSelect;
export type InsertParent = z.infer<typeof insertParentSchema>;

export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;

export type StudentCourseFee = typeof studentCourseFee.$inferSelect;
export type InsertStudentCourseFee = z.infer<typeof insertStudentCourseFeeSchema>;

export type StudentEnrollmentFees = typeof studentEnrollmentFees.$inferSelect;
export type InsertStudentEnrollmentFees = z.infer<typeof insertStudentEnrollmentFeesSchema>;

export type Transportation = typeof transportation.$inferSelect;
export type InsertTransportation = z.infer<typeof insertTransportationSchema>;

export type TransportationMode = typeof transportationMode.$inferSelect;
export type InsertTransportationMode = z.infer<typeof insertTransportationModeSchema>;

export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;

export type StudentInventory = typeof studentInventory.$inferSelect;
export type InsertStudentInventory = z.infer<typeof insertStudentInventorySchema>;

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;

export type CompensationClass = typeof compensationClasses.$inferSelect;
export type InsertCompensationClass = z.infer<typeof insertCompensationClassSchema>;

export type CompensationRequest = typeof compensationRequests.$inferSelect;
export type InsertCompensationRequest = z.infer<typeof insertCompensationRequestSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type Payroll = typeof payrolls.$inferSelect;
export type InsertPayroll = z.infer<typeof insertPayrollSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Branch = typeof branches.$inferSelect;
export type InsertBranch = z.infer<typeof insertBranchSchema>;

export type Brand = typeof brands.$inferSelect;
export type InsertBrand = z.infer<typeof insertBrandSchema>;

export type BranchBrand = typeof branchBrands.$inferSelect;
export type InsertBranchBrand = z.infer<typeof insertBranchBrandSchema>;

export type CreditNote = typeof creditNotes.$inferSelect;
export type InsertCreditNote = z.infer<typeof insertCreditNoteSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type Receipt = typeof receipts.$inferSelect;
export type InsertReceipt = z.infer<typeof insertReceiptSchema>;

export type StudentPayment = typeof studentPayments.$inferSelect;
export type InsertStudentPayment = z.infer<typeof insertStudentPaymentSchema>;

export type PaymentItem = typeof paymentItems.$inferSelect;
export type InsertPaymentItem = z.infer<typeof insertPaymentItemSchema>;

export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;

export type StockItem = typeof stockItem.$inferSelect;
export type InsertStockItem = z.infer<typeof insertStockItemSchema>;
