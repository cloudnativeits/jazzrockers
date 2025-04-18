import { pgTable, text, serial, integer, boolean, date, time, timestamp, decimal } from "drizzle-orm/pg-core";
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

// Course model
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // music, dance, art
  fee: decimal("fee", { precision: 10, scale: 2 }).notNull(),
  duration: integer("duration").notNull(), // in weeks
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCourseSchema = createInsertSchema(courses).pick({
  name: true,
  description: true,
  category: true,
  fee: true,
  duration: true,
});

// Batch model
export const batches = pgTable("batches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  courseId: integer("course_id").notNull(),
  teacherId: integer("teacher_id").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  daysOfWeek: text("days_of_week").notNull(), // comma-separated list of days
  roomNumber: text("room_number"),
  capacity: integer("capacity").notNull(),
  category: text("category").notNull(),
  branch: text("branch").notNull(),
  status: text("status").notNull().default("active"), // active, completed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
});

// Custom Zod schema for batch name validation
export const batchNameSchema = z.string().refine((val) => {
  // Format: CCBBSSYY (CC=Course Code, BB=Branch Code, SS=Serial, YY=Year)
  const regex = /^[A-Z]{2}[A-Z]{2}\d{2}\d{2}$/;
  return regex.test(val);
}, "Batch name must follow format: CCBBSSYY (Course Code + Branch Code + Serial + Year)");

export const insertBatchSchema = createInsertSchema(batches).pick({
  name: true,
  courseId: true,
  teacherId: true,
  startDate: true,
  endDate: true,
  startTime: true,
  endTime: true,
  daysOfWeek: true,
  roomNumber: true,
  capacity: true,
  category: true,
  branch: true,
  status: true,
}).extend({
  name: batchNameSchema
});

// Student model
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").notNull().unique(), // e.g., STU10284
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  username: text("username").notNull().unique(),
  password: text("password"),
  dateOfBirth: date("date_of_birth"),
  gender: text("gender"),
  parentId: integer("parent_id").notNull(),
  userId: integer("user_id"), // Associated user account for login
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  course: text("course").notNull(),
  batch: text("batch").notNull(),
  branch: text("branch").notNull(),
  enrollmentDate: date("enrollment_date").notNull(),
  status: text("status").notNull().default("active"), // active, inactive, alumni
  createdAt: timestamp("created_at").defaultNow(),
  // profilePicture: text("profile_picture"),
});

export const insertStudentSchema = createInsertSchema(students).pick({
  studentId: true,
  firstName: true,
  lastName: true,
  dateOfBirth: true,
  gender: true,
  parentId: true,
  userId: true,
  password: true,
  address: true,
  phone: true,
  email: true,
  course: true,
  batch: true,
  branch: true,
  enrollmentDate: true,
  status: true,
  // profilePicture: true,
});

// Enrollment model
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  batchId: integer("batch_id").notNull(),
  enrollmentDate: date("enrollment_date").notNull(),
  status: text("status").notNull().default("active"), // active, completed, dropped
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).pick({
  studentId: true,
  batchId: true,
  enrollmentDate: true,
  status: true,
});

// Attendance model
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").notNull(),
  date: date("date").notNull(),
  status: text("status").notNull(), // present, absent, late, excused, compensation
  remarks: text("remarks"),
  compensationDetails: text("compensation_details"), // JSON string containing: { originalClassDate, originalBatchId, compensationBatchId, branch }
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAttendanceSchema = createInsertSchema(attendance).pick({
  enrollmentId: true,
  date: true,
  status: true,
  remarks: true,
  compensationDetails: true,
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
  employeeId: text("employee_id").notNull().unique(), // e.g., EMP10284
  fullName: text("full_name").notNull(),
  userId: integer("user_id").notNull(),
  position: text("position").notNull(), // teacher, admin, staff
  joiningDate: date("joining_date").notNull(),
  email: text("email"),
  salary: decimal("salary", { precision: 10, scale: 2 }).notNull(),
  bankAccount: text("bank_account"),
  status: text("status").notNull().default("active"), // active, inactive
  branch: text("branch").notNull(),
  specialization: text("specialization"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEmployeeSchema = createInsertSchema(employees).pick({
  employeeId: true,
  fullName: true,
  userId: true,
  position: true,
  joiningDate: true,
  email: true,
  salary: true,
  bankAccount: true,
  status: true,
  branch: true,
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
  address: text("address").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  manager: text("manager"),
  status: text("status").notNull().default("active"), // active, inactive
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBranchSchema = createInsertSchema(branches).pick({
  name: true,
  address: true,
  phone: true,
  email: true,
  manager: true,
  status: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;

export type Batch = typeof batches.$inferSelect;
export type InsertBatch = z.infer<typeof insertBatchSchema>;

export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;

export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

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