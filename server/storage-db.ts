import { 
  users, User, InsertUser, 
  courses, Course, InsertCourse,
  batches, Batch, InsertBatch,
  students, Student, InsertStudent,
  enrollments, Enrollment, InsertEnrollment,
  attendance, Attendance, InsertAttendance,
  payments, Payment, InsertPayment,
  employees, Employee, InsertEmployee,
  payrolls, Payroll, InsertPayroll,
  messages, Message, InsertMessage,
  branches, Branch, InsertBranch
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool, db } from "./db";
import { eq, and, like, desc, asc } from "drizzle-orm";
import { IStorage } from "./storage";

// PostgreSQL session store
const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
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
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  
  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values({
      ...user,
      password: String(user.password), // Ensure password is a string
      createdAt: new Date()
    }).returning();
    return result[0];
  }
  
  async updateUser(id: number, user: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }
  
  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }
  
  // Course methods
  async getCourse(id: number): Promise<Course | undefined> {
    const result = await db.select().from(courses).where(eq(courses.id, id));
    return result[0];
  }
  
  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses);
  }
  
  async getCoursesByCategory(category: string): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.category, category));
  }
  
  async createCourse(course: InsertCourse): Promise<Course> {
    const result = await db.insert(courses).values({
      ...course,
      createdAt: new Date()
    }).returning();
    return result[0];
  }
  
  async updateCourse(id: number, course: Partial<Course>): Promise<Course | undefined> {
    const result = await db.update(courses)
      .set(course)
      .where(eq(courses.id, id))
      .returning();
    return result[0];
  }
  
  async deleteCourse(id: number): Promise<boolean> {
    const result = await db.delete(courses).where(eq(courses.id, id)).returning();
    return result.length > 0;
  }
  
  // Batch methods
  async getBatch(id: number): Promise<Batch | undefined> {
    const result = await db.select().from(batches).where(eq(batches.id, id));
    return result[0];
  }
  
  async getBatches(): Promise<Batch[]> {
    return await db.select().from(batches);
  }
  
  async getBatchesByCourse(courseId: number): Promise<Batch[]> {
    return await db.select().from(batches).where(eq(batches.courseId, courseId));
  }
  
  async getBatchesByTeacher(teacherId: number): Promise<Batch[]> {
    return await db.select().from(batches).where(eq(batches.teacherId, teacherId));
  }
  
  async getBatchesByBranch(branch: string): Promise<Batch[]> {
    return await db.select().from(batches).where(eq(batches.branch, branch));
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
  
  async updateBatch(id: number, batch: Partial<Batch>): Promise<Batch | undefined> {
    const result = await db.update(batches)
      .set(batch)
      .where(eq(batches.id, id))
      .returning();
    return result[0];
  }
  
  async deleteBatch(id: number): Promise<boolean> {
    const result = await db.delete(batches).where(eq(batches.id, id)).returning();
    return result.length > 0;
  }
  
  // Student methods
  async getStudent(id: number): Promise<Student | undefined> {
    const result = await db.select().from(students).where(eq(students.id, id));
    return result[0];
  }
  
  async getStudentByStudentId(studentId: string): Promise<Student | undefined> {
    const result = await db.select().from(students).where(eq(students.studentId, studentId));
    return result[0];
  }
  
  async getStudents(): Promise<Student[]> {
    return await db.select().from(students);
  }
  
  async getStudentsByParent(parentId: number): Promise<Student[]> {
    return await db.select().from(students).where(eq(students.parentId, parentId));
  }
  
  async getStudentsByBranch(branch: string): Promise<Student[]> {
    return await db.select().from(students).where(eq(students.branch, branch));
  }
  
  async createStudent(student: InsertStudent): Promise<Student> {
    const result = await db.insert(students).values({
      ...student,
      email: student.email || null,
      phone: student.phone || null,
      address: student.address || null,
      dateOfBirth: student.dateOfBirth || null,
      gender: student.gender || null,
      status: student.status || "active",
      createdAt: new Date(),
    }).returning();
    return result[0];
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
  
  // Enrollment methods
  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    const result = await db.select().from(enrollments).where(eq(enrollments.id, id));
    return result[0];
  }
  
  async getEnrollments(): Promise<Enrollment[]> {
    return await db.select().from(enrollments);
  }
  
  async getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]> {
    return await db.select().from(enrollments).where(eq(enrollments.studentId, studentId));
  }
  
  async getEnrollmentsByBatch(batchId: number): Promise<Enrollment[]> {
    return await db.select().from(enrollments).where(eq(enrollments.batchId, batchId));
  }
  
  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const result = await db.insert(enrollments).values({
      ...enrollment,
      status: enrollment.status || "active",
      createdAt: new Date()
    }).returning();
    return result[0];
  }
  
  async updateEnrollment(id: number, enrollment: Partial<Enrollment>): Promise<Enrollment | undefined> {
    const result = await db.update(enrollments)
      .set(enrollment)
      .where(eq(enrollments.id, id))
      .returning();
    return result[0];
  }
  
  async deleteEnrollment(id: number): Promise<boolean> {
    const result = await db.delete(enrollments).where(eq(enrollments.id, id)).returning();
    return result.length > 0;
  }
  
  // Attendance methods
  async getAttendance(id: number): Promise<Attendance | undefined> {
    const result = await db.select().from(attendance).where(eq(attendance.id, id));
    return result[0];
  }
  
  async getAttendanceByEnrollment(enrollmentId: number): Promise<Attendance[]> {
    return await db.select().from(attendance).where(eq(attendance.enrollmentId, enrollmentId));
  }
  
  async getAttendanceByDate(date: Date): Promise<Attendance[]> {
    // Format date as YYYY-MM-DD
    const dateStr = date.toISOString().split('T')[0];
    return await db.select().from(attendance).where(eq(attendance.date, dateStr));
  }
  
  async createAttendance(data: InsertAttendance): Promise<Attendance> {
    const result = await db.insert(attendance).values({
      date: data.date,
      status: data.status,
      enrollmentId: data.enrollmentId,
      remarks: data.remarks || null,
      createdAt: new Date()
    }).returning();
    return result[0];
  }
  
  async updateAttendance(id: number, attendanceData: Partial<Attendance>): Promise<Attendance | undefined> {
    const result = await db.update(attendance)
      .set(attendanceData)
      .where(eq(attendance.id, id))
      .returning();
    return result[0];
  }
  
  async deleteAttendance(id: number): Promise<boolean> {
    const result = await db.delete(attendance).where(eq(attendance.id, id)).returning();
    return result.length > 0;
  }
  
  // Payment methods
  async getPayment(id: number): Promise<Payment | undefined> {
    const result = await db.select().from(payments).where(eq(payments.id, id));
    return result[0];
  }
  
  async getPaymentByInvoiceId(invoiceId: string): Promise<Payment | undefined> {
    const result = await db.select().from(payments).where(eq(payments.invoiceId, invoiceId));
    return result[0];
  }
  
  async getPayments(): Promise<Payment[]> {
    return await db.select().from(payments);
  }
  
  async getPaymentsByStudent(studentId: number): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.studentId, studentId));
  }
  
  async getPaymentsByStatus(status: string): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.status, status));
  }
  
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const result = await db.insert(payments).values({
      ...payment,
      paymentMethod: payment.paymentMethod || null,
      remarks: payment.remarks || null,
      createdAt: new Date()
    }).returning();
    return result[0];
  }
  
  async updatePayment(id: number, payment: Partial<Payment>): Promise<Payment | undefined> {
    const result = await db.update(payments)
      .set(payment)
      .where(eq(payments.id, id))
      .returning();
    return result[0];
  }
  
  async deletePayment(id: number): Promise<boolean> {
    const result = await db.delete(payments).where(eq(payments.id, id)).returning();
    return result.length > 0;
  }
  
  // Employee methods
  async getEmployee(id: number): Promise<Employee | undefined> {
    const result = await db.select().from(employees).where(eq(employees.id, id));
    return result[0];
  }
  
  async getEmployeeByEmployeeId(employeeId: string): Promise<Employee | undefined> {
    const result = await db.select().from(employees).where(eq(employees.employeeId, employeeId));
    return result[0];
  }
  
  async getEmployees(): Promise<Employee[]> {
    return await db.select().from(employees);
  }
  
  async getEmployeesByPosition(position: string): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.position, position));
  }
  
  async getEmployeesByBranch(branch: string): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.branch, branch));
  }
  
  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const result = await db.insert(employees).values({
      ...employee,
      status: employee.status || "active",
      bankAccount: employee.bankAccount || null,
      createdAt: new Date()
    }).returning();
    return result[0];
  }
  
  async updateEmployee(id: number, employee: Partial<Employee>): Promise<Employee | undefined> {
    const result = await db.update(employees)
      .set(employee)
      .where(eq(employees.id, id))
      .returning();
    return result[0];
  }
  
  async deleteEmployee(id: number): Promise<boolean> {
    const result = await db.delete(employees).where(eq(employees.id, id)).returning();
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
    return await db.select().from(payrolls).where(eq(payrolls.employeeId, employeeId));
  }
  
  async getPayrollsByMonth(month: string): Promise<Payroll[]> {
    return await db.select().from(payrolls).where(eq(payrolls.month, month));
  }
  
  async createPayroll(payroll: InsertPayroll): Promise<Payroll> {
    const result = await db.insert(payrolls).values({
      ...payroll,
      status: payroll.status || "pending",
      paymentDate: payroll.paymentDate || null,
      remarks: payroll.remarks || null,
      incentives: payroll.incentives || null,
      deductions: payroll.deductions || null,
      createdAt: new Date()
    }).returning();
    return result[0];
  }
  
  async updatePayroll(id: number, payroll: Partial<Payroll>): Promise<Payroll | undefined> {
    const result = await db.update(payrolls)
      .set(payroll)
      .where(eq(payrolls.id, id))
      .returning();
    return result[0];
  }
  
  async deletePayroll(id: number): Promise<boolean> {
    const result = await db.delete(payrolls).where(eq(payrolls.id, id)).returning();
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
    return await db.select().from(messages).where(eq(messages.senderId, senderId));
  }
  
  async getMessagesByReceiver(receiverId: number): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.receiverId, receiverId));
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values({
      ...message,
      sentAt: new Date(),
      readAt: null,
      status: "unread"
    }).returning();
    return result[0];
  }
  
  async updateMessage(id: number, message: Partial<Message>): Promise<Message | undefined> {
    const result = await db.update(messages)
      .set(message)
      .where(eq(messages.id, id))
      .returning();
    return result[0];
  }
  
  async deleteMessage(id: number): Promise<boolean> {
    const result = await db.delete(messages).where(eq(messages.id, id)).returning();
    return result.length > 0;
  }
  
  // Branch methods
  async getBranch(id: number): Promise<Branch | undefined> {
    const result = await db.select().from(branches).where(eq(branches.id, id));
    return result[0];
  }
  
  async getBranches(): Promise<Branch[]> {
    return await db.select().from(branches);
  }
  
  async getBranchByName(name: string): Promise<Branch | undefined> {
    const result = await db.select().from(branches).where(eq(branches.name, name));
    return result[0];
  }
  
  async createBranch(branch: InsertBranch): Promise<Branch> {
    const result = await db.insert(branches).values({
      ...branch,
      email: branch.email || null,
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
    const result = await db.delete(branches).where(eq(branches.id, id)).returning();
    return result.length > 0;
  }
}