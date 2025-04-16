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
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Session store
  sessionStore: session.Store;

  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsersByRole(role: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  updateUserPassword(username: string, newPassword: string): Promise<boolean>; // Added function

  // Course methods
  getCourse(id: number): Promise<Course | undefined>;
  getCourses(): Promise<Course[]>;
  getCoursesByCategory(category: string): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<Course>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<boolean>;

  // Batch methods
  getBatch(id: number): Promise<Batch | undefined>;
  getBatches(): Promise<Batch[]>;
  getBatchesByCourse(courseId: number): Promise<Batch[]>;
  getBatchesByTeacher(teacherId: number): Promise<Batch[]>;
  getBatchesByBranch(branch: string): Promise<Batch[]>;
  createBatch(batch: InsertBatch): Promise<Batch>;
  updateBatch(id: number, batch: Partial<Batch>): Promise<Batch | undefined>;
  deleteBatch(id: number): Promise<boolean>;

  // Student methods
  getStudent(id: number): Promise<Student | undefined>;
  getStudentByStudentId(studentId: string): Promise<Student | undefined>;
  getStudents(): Promise<Student[]>;
  getStudentsByParent(parentId: number): Promise<Student[]>;
  getStudentsByBranch(branch: string): Promise<Student[]>;
  getStudentsByBatch(batchId: string): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<Student>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;

  // Enrollment methods
  getEnrollment(id: number): Promise<Enrollment | undefined>;
  getEnrollments(): Promise<Enrollment[]>;
  getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]>;
  getEnrollmentsByBatch(batchId: number): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: number, enrollment: Partial<Enrollment>): Promise<Enrollment | undefined>;
  deleteEnrollment(id: number): Promise<boolean>;

  // Attendance methods
  getAttendance(id: number): Promise<Attendance | undefined>;
  getAttendanceByEnrollment(enrollmentId: number): Promise<Attendance[]>;
  getAttendanceByDate(date: Date): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: number, attendance: Partial<Attendance>): Promise<Attendance | undefined>;
  deleteAttendance(id: number): Promise<boolean>;

  // Payment methods
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentByInvoiceId(invoiceId: string): Promise<Payment | undefined>;
  getPayments(): Promise<Payment[]>;
  getPaymentsByStudent(studentId: number): Promise<Payment[]>;
  getPaymentsByStatus(status: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<Payment>): Promise<Payment | undefined>;
  deletePayment(id: number): Promise<boolean>;

  // Employee methods
  getEmployee(id: number): Promise<Employee | undefined>;
  getEmployeeByEmployeeId(employeeId: string): Promise<Employee | undefined>;
  getEmployees(): Promise<Employee[]>;
  getEmployeesByPosition(position: string): Promise<Employee[]>;
  getEmployeesByBranch(branch: string): Promise<Employee[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<Employee>): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;

  // Payroll methods
  getPayroll(id: number): Promise<Payroll | undefined>;
  getPayrolls(): Promise<Payroll[]>;
  getPayrollsByEmployee(employeeId: number): Promise<Payroll[]>;
  getPayrollsByMonth(month: string): Promise<Payroll[]>;
  createPayroll(payroll: InsertPayroll): Promise<Payroll>;
  updatePayroll(id: number, payroll: Partial<Payroll>): Promise<Payroll | undefined>;
  deletePayroll(id: number): Promise<boolean>;

  // Message methods
  getMessage(id: number): Promise<Message | undefined>;
  getMessages(): Promise<Message[]>;
  getMessagesBySender(senderId: number): Promise<Message[]>;
  getMessagesByReceiver(receiverId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: number, message: Partial<Message>): Promise<Message | undefined>;
  deleteMessage(id: number): Promise<boolean>;

  // Branch methods
  getBranch(id: number): Promise<Branch | undefined>;
  getBranches(): Promise<Branch[]>;
  getBranchByName(name: string): Promise<Branch | undefined>;
  createBranch(branch: InsertBranch): Promise<Branch>;
  updateBranch(id: number, branch: Partial<Branch>): Promise<Branch | undefined>;
  deleteBranch(id: number): Promise<boolean>;
}

// Simple placeholder for password hashing (replace with a robust solution)
async function hashPassword(password: string): Promise<string> {
  return password; // Simple direct return for testing purposes
}


export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private coursesMap: Map<number, Course>;
  private batchesMap: Map<number, Batch>;
  private studentsMap: Map<number, Student>;
  private enrollmentsMap: Map<number, Enrollment>;
  private attendanceMap: Map<number, Attendance>;
  private paymentsMap: Map<number, Payment>;
  private employeesMap: Map<number, Employee>;
  private payrollsMap: Map<number, Payroll>;
  private messagesMap: Map<number, Message>;
  private branchesMap: Map<number, Branch>;

  sessionStore: session.Store;

  private userCurrentId: number = 1;
  private courseCurrentId: number = 1;
  private batchCurrentId: number = 1;
  private studentCurrentId: number = 1;
  private enrollmentCurrentId: number = 1;
  private attendanceCurrentId: number = 1;
  private paymentCurrentId: number = 1;
  private employeeCurrentId: number = 1;
  private payrollCurrentId: number = 1;
  private messageCurrentId: number = 1;
  private branchCurrentId: number = 1;

  constructor() {
    this.usersMap = new Map();
    this.coursesMap = new Map();
    this.batchesMap = new Map();
    this.studentsMap = new Map();
    this.enrollmentsMap = new Map();
    this.attendanceMap = new Map();
    this.paymentsMap = new Map();
    this.employeesMap = new Map();
    this.payrollsMap = new Map();
    this.messagesMap = new Map();
    this.branchesMap = new Map();

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    // Seed data
    this.seedData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username === username
    );
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.usersMap.values());
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.usersMap.values()).filter(
      (user) => user.role === role
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const newUser: User = {
      ...user, id, createdAt: new Date(), role: user.role ?? "user",
      phone: user.phone ?? null,
      address: user.address ?? null,
      branch: user.branch ?? null,
      // profilePicture: user.profilePicture ?? null,
    };
    this.usersMap.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, user: Partial<User>): Promise<User | undefined> {
    const existingUser = this.usersMap.get(id);
    if (!existingUser) return undefined;

    const updatedUser = { ...existingUser, ...user };
    this.usersMap.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.usersMap.delete(id);
  }

  async updateUserPassword(username: string, newPassword: string): Promise<boolean> {
    const user = await this.getUserByUsername(username);
    if (!user) return false;

    const hashedPassword = await hashPassword(newPassword);
    const updatedUser = { ...user, password: hashedPassword };
    this.usersMap.set(user.id, updatedUser);
    return true;
  }

  // Course methods
  async getCourse(id: number): Promise<Course | undefined> {
    return this.coursesMap.get(id);
  }

  async getCourses(): Promise<Course[]> {
    return Array.from(this.coursesMap.values());
  }

  async getCoursesByCategory(category: string): Promise<Course[]> {
    return Array.from(this.coursesMap.values()).filter(
      (course) => course.category === category
    );
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const id = this.courseCurrentId++;
    const newCourse: Course = { ...course, id, createdAt: new Date(), description: course.description ?? null, };
    this.coursesMap.set(id, newCourse);
    return newCourse;
  }

  async updateCourse(id: number, course: Partial<Course>): Promise<Course | undefined> {
    const existingCourse = this.coursesMap.get(id);
    if (!existingCourse) return undefined;

    const updatedCourse = { ...existingCourse, ...course };
    this.coursesMap.set(id, updatedCourse);
    return updatedCourse;
  }

  async deleteCourse(id: number): Promise<boolean> {
    return this.coursesMap.delete(id);
  }

  // Batch methods
  async getBatch(id: number): Promise<Batch | undefined> {
    return this.batchesMap.get(id);
  }

  async getBatches(): Promise<Batch[]> {
    return Array.from(this.batchesMap.values());
  }

  async getBatchesByCourse(courseId: number): Promise<Batch[]> {
    return Array.from(this.batchesMap.values()).filter(
      (batch) => batch.courseId === courseId
    );
  }

  async getBatchesByTeacher(teacherId: number): Promise<Batch[]> {
    return Array.from(this.batchesMap.values()).filter(
      (batch) => batch.teacherId === teacherId
    );
  }

  async getBatchesByBranch(branch: string): Promise<Batch[]> {
    return Array.from(this.batchesMap.values()).filter(
      (batch) => batch.branch === branch
    );
  }

  async createBatch(batch: InsertBatch): Promise<Batch> {
    const id = this.batchCurrentId++;
    const newBatch: Batch = { ...batch, id, createdAt: new Date(),
      status: batch.status ?? "active",
      roomNumber: batch.roomNumber ?? null, };
    this.batchesMap.set(id, newBatch);
    return newBatch;
  }

  async updateBatch(id: number, batch: Partial<Batch>): Promise<Batch | undefined> {
    const existingBatch = this.batchesMap.get(id);
    if (!existingBatch) return undefined;

    const updatedBatch = { ...existingBatch, ...batch };
    this.batchesMap.set(id, updatedBatch);
    return updatedBatch;
  }

  async deleteBatch(id: number): Promise<boolean> {
    return this.batchesMap.delete(id);
  }

  // Student methods
  async getStudent(id: number): Promise<Student | undefined> {
    return this.studentsMap.get(id);
  }

  async getStudentByStudentId(studentId: string): Promise<Student | undefined> {
    return Array.from(this.studentsMap.values()).find(
      (student) => student.studentId === studentId
    );
  }

  async getStudents(): Promise<Student[]> {
    return Array.from(this.studentsMap.values());
  }

  async getStudentsByParent(parentId: number): Promise<Student[]> {
    return Array.from(this.studentsMap.values()).filter(
      (student) => student.parentId === parentId
    );
  }

  async getStudentsByBranch(branch: string): Promise<Student[]> {
    return Array.from(this.studentsMap.values()).filter(
      (student) => student.branch === branch
    );
  }

  async getStudentsByBatch(batchId: string): Promise<Student[]> {
    const students = Array.from(this.studentsMap.values());
    return students.filter(student => student.batch === batchId);
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const id = this.studentCurrentId++;
    const newStudent: Student = {
      ...student,
      id,
      createdAt: new Date(),
      dateOfBirth: student.dateOfBirth ?? null,
      gender: student.gender ?? null,
      address: student.address ?? null,
      phone: student.phone ?? null,
      email: student.email ?? null,
      // profilePicture: student.profilePicture ?? null,
      userId: student.userId ?? null,
      password: student.password ?? null,
      status: student.status ?? "active",
    };
    this.studentsMap.set(id, newStudent);
    return newStudent;
  }

  async updateStudent(id: number, student: Partial<Student>): Promise<Student | undefined> {
    const existingStudent = this.studentsMap.get(id);
    if (!existingStudent) return undefined;

    const updatedStudent = { ...existingStudent, ...student };
    this.studentsMap.set(id, updatedStudent);
    return updatedStudent;
  }

  async deleteStudent(id: number): Promise<boolean> {
    return this.studentsMap.delete(id);
  }

  // Enrollment methods
  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    return this.enrollmentsMap.get(id);
  }

  async getEnrollments(): Promise<Enrollment[]> {
    return Array.from(this.enrollmentsMap.values());
  }

  async getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollmentsMap.values()).filter(
      (enrollment) => enrollment.studentId === studentId
    );
  }

  async getEnrollmentsByBatch(batchId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollmentsMap.values()).filter(
      (enrollment) => enrollment.batchId === batchId
    );
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const id = this.enrollmentCurrentId++;
    const newEnrollment: Enrollment = { ...enrollment, id, createdAt: new Date(), status: enrollment.status || "active"};
    this.enrollmentsMap.set(id, newEnrollment);
    return newEnrollment;
  }

  async updateEnrollment(id: number, enrollment: Partial<Enrollment>): Promise<Enrollment | undefined> {
    const existingEnrollment = this.enrollmentsMap.get(id);
    if (!existingEnrollment) return undefined;

    const updatedEnrollment = { ...existingEnrollment, ...enrollment };
    this.enrollmentsMap.set(id, updatedEnrollment);
    return updatedEnrollment;
  }

  async deleteEnrollment(id: number): Promise<boolean> {
    return this.enrollmentsMap.delete(id);
  }

  // Attendance methods
  async getAttendance(id: number): Promise<Attendance | undefined> {
    return this.attendanceMap.get(id);
  }

  async getAttendanceByEnrollment(enrollmentId: number): Promise<Attendance[]> {
    return Array.from(this.attendanceMap.values()).filter(
      (attendance) => attendance.enrollmentId === enrollmentId
    );
  }

  async getAttendanceByDate(date: Date): Promise<Attendance[]> {
    return Array.from(this.attendanceMap.values()).filter(
      (attendance) => new Date(attendance.date).toDateString() === date.toDateString()
    );
  }

  async createAttendance(attendance: InsertAttendance): Promise<Attendance> {
    const id = this.attendanceCurrentId++;
    const newAttendance: Attendance = { ...attendance, id, createdAt: new Date(), remarks: attendance.remarks || null, compensationDetails: attendance.compensationDetails || null };
    this.attendanceMap.set(id, newAttendance);
    return newAttendance;
  }

  async updateAttendance(id: number, attendance: Partial<Attendance>): Promise<Attendance | undefined> {
    const existingAttendance = this.attendanceMap.get(id);
    if (!existingAttendance) return undefined;

    const updatedAttendance = { ...existingAttendance, ...attendance };
    this.attendanceMap.set(id, updatedAttendance);
    return updatedAttendance;
  }

  async deleteAttendance(id: number): Promise<boolean> {
    return this.attendanceMap.delete(id);
  }

  // Payment methods
  async getPayment(id: number): Promise<Payment | undefined> {
    return this.paymentsMap.get(id);
  }

  async getPaymentByInvoiceId(invoiceId: string): Promise<Payment | undefined> {
    return Array.from(this.paymentsMap.values()).find(
      (payment) => payment.invoiceId === invoiceId
    );
  }

  async getPayments(): Promise<Payment[]> {
    return Array.from(this.paymentsMap.values());
  }

  async getPaymentsByStudent(studentId: number): Promise<Payment[]> {
    return Array.from(this.paymentsMap.values()).filter(
      (payment) => payment.studentId === studentId
    );
  }

  async getPaymentsByStatus(status: string): Promise<Payment[]> {
    return Array.from(this.paymentsMap.values()).filter(
      (payment) => payment.status === status
    );
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const id = this.paymentCurrentId++;
    const newPayment: Payment = { ...payment, id, createdAt: new Date(), remarks: payment.remarks || null, paymentMethod: payment.paymentMethod || null};
    this.paymentsMap.set(id, newPayment);
    return newPayment;
  }

  async updatePayment(id: number, payment: Partial<Payment>): Promise<Payment | undefined> {
    const existingPayment = this.paymentsMap.get(id);
    if (!existingPayment) return undefined;

    const updatedPayment = { ...existingPayment, ...payment };
    this.paymentsMap.set(id, updatedPayment);
    return updatedPayment;
  }

  async deletePayment(id: number): Promise<boolean> {
    return this.paymentsMap.delete(id);
  }

  // Employee methods
  async getEmployee(id: number): Promise<Employee | undefined> {
    return this.employeesMap.get(id);
  }

  async getEmployeeByEmployeeId(employeeId: string): Promise<Employee | undefined> {
    return Array.from(this.employeesMap.values()).find(
      (employee) => employee.employeeId === employeeId
    );
  }

  async getEmployees(): Promise<Employee[]> {
    return Array.from(this.employeesMap.values());
  }

  async getEmployeesByPosition(position: string): Promise<Employee[]> {
    return Array.from(this.employeesMap.values()).filter(
      (employee) => employee.position === position
    );
  }

  async getEmployeesByBranch(branch: string): Promise<Employee[]> {
    return Array.from(this.employeesMap.values()).filter(
      (employee) => employee.branch === branch
    );
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const id = this.employeeCurrentId++;
    const newEmployee: Employee = { ...employee, id, createdAt: new Date(), status: employee.status || 'active', bankAccount: employee.bankAccount || null};
    this.employeesMap.set(id, newEmployee);
    return newEmployee;
  }

  async updateEmployee(id: number, employee: Partial<Employee>): Promise<Employee | undefined> {
    const existingEmployee = this.employeesMap.get(id);
    if (!existingEmployee) return undefined;

    const updatedEmployee = { ...existingEmployee, ...employee };
    this.employeesMap.set(id, updatedEmployee);
    return updatedEmployee;
  }

  async deleteEmployee(id: number): Promise<boolean> {
    return this.employeesMap.delete(id);
  }

  // Payroll methods
  async getPayroll(id: number): Promise<Payroll | undefined> {
    return this.payrollsMap.get(id);
  }

  async getPayrolls(): Promise<Payroll[]> {
    return Array.from(this.payrollsMap.values());
  }

  async getPayrollsByEmployee(employeeId: number): Promise<Payroll[]> {
    return Array.from(this.payrollsMap.values()).filter(
      (payroll) => payroll.employeeId === employeeId
    );
  }

  async getPayrollsByMonth(month: string): Promise<Payroll[]> {
    return Array.from(this.payrollsMap.values()).filter(
      (payroll) => payroll.month === month
    );
  }

  async createPayroll(payroll: InsertPayroll): Promise<Payroll> {
    const id = this.payrollCurrentId++;
    const newPayroll: Payroll = { ...payroll, id, createdAt: new Date(), paymentDate: payroll.paymentDate ? new Date(payroll.paymentDate).toISOString() : null,
      status: payroll.status || 'pending',
      incentives: payroll.incentives || '0',
      deductions: payroll.deductions || '0',
      remarks: payroll.remarks || null
     };
    this.payrollsMap.set(id, newPayroll);
    return newPayroll;
  }

  async updatePayroll(id: number, payroll: Partial<Payroll>): Promise<Payroll | undefined> {
    const existingPayroll = this.payrollsMap.get(id);
    if (!existingPayroll) return undefined;

    const updatedPayroll = { ...existingPayroll, ...payroll };
    this.payrollsMap.set(id, updatedPayroll);
    return updatedPayroll;
  }

  async deletePayroll(id: number): Promise<boolean> {
    return this.payrollsMap.delete(id);
  }

  // Message methods
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messagesMap.get(id);
  }

  async getMessages(): Promise<Message[]> {
    return Array.from(this.messagesMap.values());
  }

  async getMessagesBySender(senderId: number): Promise<Message[]> {
    return Array.from(this.messagesMap.values()).filter(
      (message) => message.senderId === senderId
    );
  }

  async getMessagesByReceiver(receiverId: number): Promise<Message[]> {
    return Array.from(this.messagesMap.values()).filter(
      (message) => message.receiverId === receiverId
    );
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.messageCurrentId++;
    const newMessage: Message = {
      ...message,
      id,
      sentAt: new Date(),
      status: "sent",
      readAt: null,
    };
    this.messagesMap.set(id, newMessage);
    return newMessage;
  }

  async updateMessage(id: number, message: Partial<Message>): Promise<Message | undefined> {
    const existingMessage = this.messagesMap.get(id);
    if (!existingMessage) return undefined;

    const updatedMessage = { ...existingMessage, ...message };
    this.messagesMap.set(id, updatedMessage);
    return updatedMessage;
  }

  async deleteMessage(id: number): Promise<boolean> {
    return this.messagesMap.delete(id);
  }

  // Branch methods
  async getBranch(id: number): Promise<Branch | undefined> {
    return this.branchesMap.get(id);
  }

  async getBranches(): Promise<Branch[]> {
    return Array.from(this.branchesMap.values());
  }

  async getBranchByName(name: string): Promise<Branch | undefined> {
    return Array.from(this.branchesMap.values()).find(
      (branch) => branch.name === name
    );
  }

  async createBranch(branch: InsertBranch): Promise<Branch> {
    const id = this.branchCurrentId++;
    const newBranch: Branch = { ...branch, id, createdAt: new Date(), email: branch.email || null, manager: branch.manager || null,
      status: branch.status || "active",
     };
    this.branchesMap.set(id, newBranch);
    return newBranch;
  }

  async updateBranch(id: number, branch: Partial<Branch>): Promise<Branch | undefined> {
    const existingBranch = this.branchesMap.get(id);
    if (!existingBranch) return undefined;

    const updatedBranch = { ...existingBranch, ...branch };
    this.branchesMap.set(id, updatedBranch);
    return updatedBranch;
  }

  async deleteBranch(id: number): Promise<boolean> {
    return this.branchesMap.delete(id);
  }

  // Seed initial data
  private async seedData() {
    // Add branches
    const mainBranch = await this.createBranch({
      name: "Main Branch",
      address: "123 Main St, City Center",
      phone: "123-456-7890",
      email: "main@jazzrockers.com",
      manager: "John Smith",
      status: "active"
    });

    const northCampus = await this.createBranch({
      name: "North Campus",
      address: "456 North Ave, North City",
      phone: "123-456-7891",
      email: "north@jazzrockers.com",
      manager: "Jane Doe",
      status: "active"
    });

    const southCampus = await this.createBranch({
      name: "South Campus",
      address: "789 South St, South City",
      phone: "123-456-7892",
      email: "south@jazzrockers.com",
      manager: "Bob Johnson",
      status: "active"
    });

    const eastCampus = await this.createBranch({
      name: "East Campus",
      address: "101 East Blvd, East City",
      phone: "123-456-7893",
      email: "east@jazzrockers.com",
      manager: "Sarah Williams",
      status: "active"
    });

    // Add admin user
    const adminUser = await this.createUser({
      username: "admin",
      password: "admin123", // Simple password for testing
      email: "admin@jazzrockers.com",
      fullName: "Admin User",
      role: "admin",
      branch: mainBranch.name
    });

    // Add teacher users
    const sameerUser = await this.createUser({
      username: "sameer",
      password: "$2b$10$K5xFuuY1Uwt0j0/qMBZE8uHrOCe4Y11QkfE9gxrKdWJ9bhvTXCSea", // 'password'
      email: "sameer@jazzrockers.com",
      fullName: "Sameer Kumar",
      role: "teacher",
      branch: mainBranch.name
    });

    const nikhilUser = await this.createUser({
      username: "nikhil",
      password: "$2b$10$K5xFuuY1Uwt0j0/qMBZE8uHrOCe4Y11QkfE9gxrKdWJ9bhvTXCSea", // 'password'
      email: "nikhil@jazzrockers.com",
      fullName: "Nikhil Singh",
      role: "teacher",
      branch: mainBranch.name
    });

    const rituUser = await this.createUser({
      username: "ritu",
      password: "$2b$10$K5xFuuY1Uwt0j0/qMBZE8uHrOCe4Y11QkfE9gxrKdWJ9bhvTXCSea", // 'password'
      email: "ritu@jazzrockers.com",
      fullName: "Ritu Agarwal",
      role: "teacher",
      branch: mainBranch.name
    });

    const priyaUser = await this.createUser({
      username: "priya",
      password: "$2b$10$K5xFuuY1Uwt0j0/qMBZE8uHrOCe4Y11QkfE9gxrKdWJ9bhvTXCSea", // 'password'
      email: "priya@jazzrockers.com",
      fullName: "Priya Joshi",
      role: "teacher",
      branch: mainBranch.name
    });

    // Add parent users
    const aryanParent = await this.createUser({
      username: "aryanparent",
      password: "$2b$10$K5xFuuY1Uwt0j0/qMBZE8uHrOCe4Y11QkfE9gxrKdWJ9bhvTXCSea", // 'password'
      email: "aryanparent@example.com",
      fullName: "Rajesh Rajput",
      role: "parent",
      branch: mainBranch.name
    });

    const sanyaParent = await this.createUser({
      username: "sanyaparent",
      password: "$2b$10$K5xFuuY1Uwt0j0/qMBZE8uHrOCe4Y11QkfE9gxrKdWJ9bhvTXCSea", // 'password'
      email: "sanyaparent@example.com",
      fullName: "Dinesh Desai",
      role: "parent",
      branch: mainBranch.name
    });

    const rohanParent = await this.createUser({
      username: "rohanparent",
      password: "$2b$10$K5xFuuY1Uwt0j0/qMBZE8uHrOCe4Y11QkfE9gxrKdWJ9bhvTXCSea", // 'password'
      email: "rohanparent@example.com",
      fullName: "Prakash Patel",
      role: "parent",
      branch: mainBranch.name
    });

    const kavyaParent = await this.createUser({
      username: "kavyaparent",
      password: "$2b$10$K5xFuuY1Uwt0j0/qMBZE8uHrOCe4Y11QkfE9gxrKdWJ9bhvTXCSea", // 'password'
      email: "kavyaparent@example.com",
      fullName: "Ramesh Sharma",
      role: "parent",
      branch: mainBranch.name
    });

    const arnavParent = await this.createUser({
      username: "arnavparent",
      password: "$2b$10$K5xFuuY1Uwt0j0/qMBZE8uHrOCe4Y11QkfE9gxrKdWJ9bhvTXCSea", // 'password'
      email: "arnavparent@example.com",
      fullName: "Ajay Mehta",
      role: "parent",
      branch: mainBranch.name
    });

    // Add courses
    const pianoCourse = await this.createCourse({
      name: "Piano Basics",
      description: "Learn the basics of playing the piano",
      category: "music",
      fee: String(12500),
      duration: 12
    });

    const guitarCourse = await this.createCourse({
      name: "Guitar Advanced",
      description: "Advanced guitar techniques and theory",
      category: "music",
      fee: String(12500),
      duration: 16
    });

    const vocalCourse = await this.createCourse({
      name: "Vocal Training",
      description: "Voice training and singing techniques",
      category: "music",
      fee: String(8000),
      duration: 8
    });

    const drumsCourse = await this.createCourse({
      name: "Drums Beginner",
      description: "Introduction to drumming",
      category: "music",
      fee: String(9500),
      duration: 10
    });

    const kathakCourse = await this.createCourse({
      name: "Dance Kathak",
      description: "Learn the classical Indian dance form Kathak",
      category: "dance",
      fee: String(10500),
      duration: 14
    });

    // Add employees
    const sameerEmployee = await this.createEmployee({
      employeeId: "EMP001",
      userId: sameerUser.id,
      position: "teacher",
      joiningDate: new Date("2020-01-15").toISOString(),
      salary: String(50000),
      bankAccount: "HDFC12345",
      status: "active",
      branch: mainBranch.name
    });

    const nikhilEmployee = await this.createEmployee({
      employeeId: "EMP002",
      userId: nikhilUser.id,
      position: "teacher",
      joiningDate: new Date("2020-03-10").toISOString(),
      salary: String(55000),
      bankAccount: "ICICI67890",
      status: "active",
      branch: mainBranch.name
    });

    const rituEmployee = await this.createEmployee({
      employeeId: "EMP003",
      userId: rituUser.id,
      position: "teacher",
      joiningDate: new Date("2020-05-20").toISOString(),
      salary: String(52000),
      bankAccount: "SBI54321",
      status: "active",
      branch: mainBranch.name
    });

    const priyaEmployee = await this.createEmployee({
      employeeId: "EMP004",
      userId: priyaUser.id,
      position: "teacher",
      joiningDate: new Date("2020-07-05").toISOString(),
      salary: String(48000),
      bankAccount: "AXIS09876",
      status: "active",
      branch: mainBranch.name
    });

    // Add batches
    const pianoBatch = await this.createBatch({
      name: "Piano Basics - Batch P01",
      courseId: pianoCourse.id,
      teacherId: sameerEmployee.id,
      startDate: new Date("2023-07-01").toISOString(),
      endDate: new Date("2023-09-30").toISOString(),
      startTime: new Date(0, 0, 0, 10, 0).toISOString(),
      endTime: new Date(0, 0, 0, 11, 30).toISOString(),
      daysOfWeek: "Monday,Wednesday,Friday",
      roomNumber: "Room 103",
      capacity: 15,
      branch: mainBranch.name,
      status: "active"
    });

    const guitarBatch = await this.createBatch({
      name: "Guitar Advanced - Batch G03",
      courseId: guitarCourse.id,
      teacherId: nikhilEmployee.id,
      startDate: new Date("2023-07-01").toISOString(),
      endDate: new Date("2023-10-31").toISOString(),
      startTime: new Date(0, 0, 0, 12, 0).toISOString(),
      endTime: new Date(0, 0, 0, 13, 30).toISOString(),
      daysOfWeek: "Tuesday,Thursday,Saturday",
      roomNumber: "Room 105",
      capacity: 10,
      branch: mainBranch.name,
      status: "active"
    });

    const kathakBatch = await this.createBatch({
      name: "Kathak Dance - Batch D02",
      courseId: kathakCourse.id,
      teacherId: rituEmployee.id,
      startDate: new Date("2023-07-01").toISOString(),
      endDate: new Date("2023-10-15").toISOString(),
      startTime: new Date(0, 0, 0, 16, 0).toISOString(),
      endTime: new Date(0, 0, 0, 17, 30).toISOString(),
      daysOfWeek: "Tuesday,Thursday,Saturday",
      roomNumber: "Dance Hall 2",
      capacity: 20,
      branch: mainBranch.name,
      status: "active"
    });

    const vocalBatch = await this.createBatch({
      name: "Vocal Training - Batch V01",
      courseId: vocalCourse.id,
      teacherId: priyaEmployee.id,
      startDate: new Date("2023-07-01").toISOString(),
      endDate: new Date("2023-08-31").toISOString(),
      startTime: new Date(0, 0, 0, 18, 0).toISOString(),
      endTime: new Date(0, 0, 0, 19, 30).toISOString(),
      daysOfWeek: "Monday,Wednesday,Friday",
      roomNumber: "Room 107",
      capacity: 12,
      branch: mainBranch.name,
      status: "active"
    });

    // Add students
    const aryanStudent = await this.createStudent({
      studentId: "STU10284",
      firstName: "Aryan",
      lastName: "Rajput",
      dateOfBirth: new Date("2010-05-15").toISOString(),
      gender: "male",
      parentId: aryanParent.id,
      address: "123 Park St, City",
      phone: "123-456-7890",
      email: "aryan@example.com",
      branch: mainBranch.name,
      enrollmentDate: new Date("2023-07-01").toISOString(),
      status: "active"
    });

    const sanyaStudent = await this.createStudent({
      studentId: "STU10423",
      firstName: "Sanya",
      lastName: "Desai",
      dateOfBirth: new Date("2009-08-22").toISOString(),
      gender: "female",
      parentId: sanyaParent.id,
      address: "456 Lake St, City",
      phone: "123-456-7891",
      email: "sanya@example.com",
      branch: mainBranch.name,
      enrollmentDate: new Date("2023-07-01").toISOString(),
      status: "active"
    });

    const rohanStudent = await this.createStudent({
      studentId: "STU10189",
      firstName: "Rohan",
      lastName: "Patel",
      dateOfBirth: new Date("2008-12-10").toISOString(),
      gender: "male",
      parentId: rohanParent.id,
      address: "789 River St, City",
      phone: "123-456-7892",
      email: "rohan@example.com",
      branch: mainBranch.name,
      enrollmentDate: new Date("2023-07-01").toISOString(),
      status: "active"
    });

    const kavyaStudent = await this.createStudent({
      studentId: "STU10345",
      firstName: "Kavya",
      lastName: "Sharma",
      dateOfBirth: new Date("2011-03-18").toISOString(),
      gender: "female",
      parentId: kavyaParent.id,
      address: "101 Hill St, City",
      phone: "123-456-7893",
      email: "kavya@example.com",
      branch: mainBranch.name,
      enrollmentDate: new Date("2023-07-01").toISOString(),
      status: "active"
    });

    const arnavStudent = await this.createStudent({
      studentId: "STU10267",
      firstName: "Arnav",
      lastName: "Mehta",
      dateOfBirth: new Date("2010-09-30").toISOString(),
      gender: "male",
      parentId: arnavParent.id,
      address: "202 Valley St, City",
      phone: "123-456-7894",
      email: "arnav@example.com",
      branch: mainBranch.name,
      enrollmentDate: new Date("2023-07-01").toISOString(),
      status: "active"
    });

    // Add enrollments
    const aryanEnrollment = await this.createEnrollment({
      studentId: aryanStudent.id,
      batchId: pianoBatch.id,
      enrollmentDate: new Date("2023-07-01").toISOString(),
      status: "active"
    });

    const sanyaEnrollment = await this.createEnrollment({
      studentId: sanyaStudent.id,
      batchId: vocalBatch.id,
      enrollmentDate: new Date("2023-07-01").toISOString(),
      status: "active"
    });

    const rohanEnrollment = await this.createEnrollment({
      studentId: rohanStudent.id,
      batchId: guitarBatch.id,
      enrollmentDate: new Date("2023-07-01").toISOString(),
      status: "active"
    });

    const kavyaEnrollment = await this.createEnrollment({
      studentId: kavyaStudent.id,
      batchId: kathakBatch.id,
      enrollmentDate: new Date("2023-07-01").toISOString(),
      status: "active"
    });

    const arnavEnrollment = await this.createEnrollment({
      studentId: arnavStudent.id,
      batchId: drumsCourse.id,
      enrollmentDate: new Date("2023-07-01").toISOString(),
      status: "active"
    });

    // Add payments
    await this.createPayment({
      invoiceId: "INV-20230715",
      studentId: aryanStudent.id,
      amount: String(12500),
      paymentDate: new Date("2023-07-15").toISOString(),
      dueDate: new Date("2023-07-20").toISOString(),
      status: "paid",
      paymentMethod: "card",
      remarks: "Monthly fee"
    });

    await this.createPayment({
      invoiceId: "INV-20230714",
      studentId: sanyaStudent.id,
      amount: String(8000),
      paymentDate: new Date("2023-07-14").toISOString(),
      dueDate: new Date("2023-07-20").toISOString(),
      status: "paid",
      paymentMethod: "cash",
      remarks: "Monthly fee"
    });

    await this.createPayment({
      invoiceId: "INV-20230713",
      studentId: rohanStudent.id,
      amount: String(15000),
      paymentDate: new Date("2023-07-13").toISOString(),
      dueDate: new Date("2023-07-20").toISOString(),
      status: "pending",
      paymentMethod: null,
      remarks: "Monthly fee"
    });

    await this.createPayment({
      invoiceId: "INV-20230712",
      studentId: kavyaStudent.id,
      amount: String(10500),
      paymentDate: new Date("2023-07-12").toISOString(),
      dueDate: new Date("2023-07-20").toISOString(),
      status: "failed",
      paymentMethod: "card",
      remarks: "Monthly fee"
    });

    await this.createPayment({
      invoiceId: "INV-20230711",
      studentId: arnavStudent.id,
      amount: String(9500),
      paymentDate: new Date("2023-07-11").toISOString(),
      dueDate: new Date("2023-07-20").toISOString(),
      status: "paid",
      paymentMethod: "bank transfer",
      remarks: "Monthly fee"
    });

    // Add payrolls
    await this.createPayroll({
      employeeId: sameerEmployee.id,
      month: "2023-07",
      basicSalary: String(50000),
      incentives: String(5000),
      deductions: String(2000),
      netSalary: String(53000),
      status: "paid",
      paymentDate: new Date("2023-07-31").toISOString(),
      remarks: "July Salary"
    });

    await this.createPayroll({
      employeeId: nikhilEmployee.id,
      month: "2023-07",
      basicSalary: String(55000),
      incentives: String(3000),
      deductions: String(2500),
      netSalary: String(55500),
      status: "paid",
      paymentDate: new Date("2023-07-31").toISOString(),
      remarks: "July Salary"
    });

    await this.createPayroll({
      employeeId: rituEmployee.id,
      month: "2023-07",
      basicSalary: String(52000),
      incentives: String(4000),
      deductions: String(2200),
      netSalary: String(53800),
      status: "paid",
      paymentDate: new Date("2023-07-31").toISOString(),
      remarks: "July Salary"
    });

    await this.createPayroll({
      employeeId: priyaEmployee.id,
      month: "2023-07",
      basicSalary: String(48000),
      incentives: String(6000),
      deductions: String(1800),
      netSalary: String(52200),
      status: "paid",
      paymentDate: new Date("2023-07-31").toISOString(),
      remarks: "July Salary"
    });
  }
}

// Import database storage
import { DatabaseStorage } from './storage-db';

// Use database storage instead of memory storage
export const storage = new DatabaseStorage();