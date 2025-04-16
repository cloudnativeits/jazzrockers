import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword, comparePasswords } from "./auth";
import { z } from "zod";
import { User } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Middleware to check if user is admin
  const isAdmin = (req: any, res: any, next: any) => {
    if (req.isAuthenticated() && req.user.role === "admin") {
      return next();
    }
    res.status(403).json({ message: "Forbidden" });
  };

  // Middleware to check if user is teacher
  const isTeacher = (req: any, res: any, next: any) => {
    if (req.isAuthenticated() && req.user.role === "teacher") {
      return next();
    }
    res.status(403).json({ message: "Forbidden" });
  };

  // Middleware to check if user is parent
  const isParent = (req: any, res: any, next: any) => {
    if (req.isAuthenticated() && req.user.role === "parent") {
      return next();
    }
    res.status(403).json({ message: "Forbidden" });
  };

  // Middleware to check if user is student
  const isStudent = (req: any, res: any, next: any) => {
    if (req.isAuthenticated() && req.user.role === "student") {
      return next();
    }
    res.status(403).json({ message: "Forbidden" });
  };

  // Dashboard data routes
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const students = await storage.getStudents();
      const payments = await storage.getPayments();
      const batches = await storage.getBatches();

      // Calculate total revenue
      const totalRevenue = payments
        .filter(payment => payment.status === "paid")
        .reduce((acc, payment) => acc + Number(payment.amount), 0);

      // Calculate pending payments
      const pendingPayments = payments
        .filter(payment => payment.status === "pending")
        .reduce((acc, payment) => acc + Number(payment.amount), 0);

      // Get active students count
      const activeStudents = students.filter(student => student.status === "active").length;

      // Get active batches count
      const activeBatches = batches.filter(batch => batch.status === "active").length;

      res.json({ 
        totalRevenue, 
        pendingPayments, 
        activeStudents, 
        activeBatches 
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/dashboard/revenue-data", isAuthenticated, async (req, res) => {
    try {
      const payments = await storage.getPayments();
      const revenueData = [
        { month: "Jul", revenue: 823450 },
        { month: "Aug", revenue: 756230 },
        { month: "Sep", revenue: 845120 },
        { month: "Oct", revenue: 901540 },
        { month: "Nov", revenue: 948920 },
        { month: "Dec", revenue: 875630 },
        { month: "Jan", revenue: 856740 },
        { month: "Feb", revenue: 923450 },
        { month: "Mar", revenue: 978650 },
        { month: "Apr", revenue: 1025480 },
        { month: "May", revenue: 987650 },
        { month: "Jun", revenue: 923450 }
      ];

      res.json(revenueData);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/dashboard/student-distribution", isAuthenticated, async (req, res) => {
    try {
      const courseCategories = ["music", "dance", "art"];
      const courses = await storage.getCourses();
      const enrollments = await storage.getEnrollments();

      const distribution = {
        music: 0,
        dance: 0,
        art: 0,
        total: 0
      };

      // Get course IDs for each category
      const musicCourseIds = courses.filter(course => course.category === "music").map(course => course.id);
      const danceCourseIds = courses.filter(course => course.category === "dance").map(course => course.id);
      const artCourseIds = courses.filter(course => course.category === "art").map(course => course.id);

      // Count students in each category
      for (const enrollment of enrollments) {
        const batch = await storage.getBatch(enrollment.batchId);
        if (batch) {
          if (musicCourseIds.includes(batch.courseId)) {
            distribution.music++;
          } else if (danceCourseIds.includes(batch.courseId)) {
            distribution.dance++;
          } else if (artCourseIds.includes(batch.courseId)) {
            distribution.art++;
          }
          distribution.total++;
        }
      }

      res.json(distribution);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/dashboard/recent-transactions", isAuthenticated, async (req, res) => {
    try {
      const payments = await storage.getPayments();
      const recentPayments = payments.sort((a, b) => {
        return new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime();
      }).slice(0, 5);

      const transactions = [];
      for (const payment of recentPayments) {
        const student = await storage.getStudent(payment.studentId);
        if (student) {
          const enrollments = await storage.getEnrollmentsByStudent(student.id);
          let courseName = "Unknown Course";

          if (enrollments.length > 0) {
            const batch = await storage.getBatch(enrollments[0].batchId);
            if (batch) {
              const course = await storage.getCourse(batch.courseId);
              if (course) {
                courseName = course.name;
              }
            }
          }

          transactions.push({
            studentId: student.studentId,
            studentName: `${student.firstName} ${student.lastName}`,
            invoiceId: payment.invoiceId,
            courseName,
            paymentDate: payment.paymentDate,
            amount: payment.amount,
            status: payment.status
          });
        }
      }

      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/dashboard/today-classes", isAuthenticated, async (req, res) => {
    try {
      const batches = await storage.getBatches();
      const today = new Date();
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const todayDay = dayNames[today.getDay()];

      const todayClasses = [];
      for (const batch of batches) {
        if (batch.status === "active" && batch.daysOfWeek.includes(todayDay)) {
          const course = await storage.getCourse(batch.courseId);
          const teacher = await storage.getEmployeeByEmployeeId("EMP00" + batch.teacherId);
          const enrollments = await storage.getEnrollmentsByBatch(batch.id);

          if (course && teacher) {
            const user = await storage.getUser(teacher.userId);
            todayClasses.push({
              batchName: batch.name,
              courseCategory: course.category,
              startTime: batch.startTime,
              endTime: batch.endTime,
              location: batch.roomNumber,
              teacherName: user ? user.fullName : "Unknown Teacher",
              studentCount: enrollments.length
            });
          }
        }
      }

      res.json(todayClasses);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Courses routes
  app.get("/api/courses", isAuthenticated, async (req, res) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/courses/:id", isAuthenticated, async (req, res) => {
    try {
      const course = await storage.getCourse(parseInt(req.params.id));
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(course);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/courses", isAdmin, async (req, res) => {
    try {
      const course = await storage.createCourse(req.body);
      res.status(201).json(course);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/courses/:id", isAdmin, async (req, res) => {
    try {
      const updatedCourse = await storage.updateCourse(parseInt(req.params.id), req.body);
      if (!updatedCourse) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(updatedCourse);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/courses/:id", isAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteCourse(parseInt(req.params.id));
      if (!deleted) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Batches routes
  app.get("/api/batches", isAuthenticated, async (req, res) => {
    try {
      const batches = await storage.getBatches();
      res.json(batches);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get batches for a specific teacher - this specific route needs to be BEFORE the /:id route
  app.get("/api/batches/teacher", isAuthenticated, async (req, res) => {
    try {
      if (req.user && req.user.role === "teacher") {
        // Find the employee record for this teacher
        const employees = await storage.getEmployees();
        const employee = employees.find(emp => emp.userId === req.user?.id);

        if (employee) {
          // Get batches where this teacher is assigned
          const allBatches = await storage.getBatches();
          const teacherBatches = allBatches.filter(batch => batch.teacherId === employee.id);
          res.json(teacherBatches);
        } else {
          res.status(404).json({ message: "Teacher not found" });
        }
      } else {
        res.status(403).json({ message: "Not authorized" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/batches/:id", isAuthenticated, async (req, res) => {
    try {
      const batch = await storage.getBatch(parseInt(req.params.id));
      if (!batch) {
        return res.status(404).json({ message: "Batch not found" });
      }
      res.json(batch);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/batches", isAdmin, async (req, res) => {
    try {
      // Get course and branch details for batch name generation
      const course = await storage.getCourse(req.body.courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      // Get all batches for serial number generation
      const existingBatches = await storage.getBatches();
      const branchBatches = existingBatches.filter(b => b.branch === req.body.branch);
      
      // Generate batch name components
      const courseCode = course.name.slice(0, 2).toUpperCase();
      const branchCode = req.body.branch.slice(0, 2).toUpperCase();
      const year = new Date().getFullYear().toString().slice(-2);
      
      // Find highest serial number for this branch and increment
      let maxSerial = 0;
      branchBatches.forEach(batch => {
        const serial = parseInt(batch.name.slice(4, 6));
        if (!isNaN(serial) && serial > maxSerial) {
          maxSerial = serial;
        }
      });
      const serialNum = (maxSerial + 1).toString().padStart(2, '0');

      // Create batch name
      const batchName = `${courseCode}${branchCode}${serialNum}${year}`;
      
      // Create batch with generated name
      const batchData = {
        ...req.body,
        name: batchName
      };
      
      const batch = await storage.createBatch(batchData);
      res.status(201).json(batch);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/batches/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid batch ID" });
      }

      const batch = await storage.getBatch(id);
      if (!batch) {
        return res.status(404).json({ message: "Batch not found" });
      }

      const updatedBatch = await storage.updateBatch(id, req.body);
      if (!updatedBatch) {
        return res.status(500).json({ message: "Failed to update batch" });
      }

      res.json(updatedBatch);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/batches/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid batch ID" });
      }

      const batch = await storage.getBatch(id);
      if (!batch) {
        return res.status(404).json({ message: "Batch not found" });
      }

      const deleted = await storage.deleteBatch(id);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete batch" });
      }

      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Students routes
  app.get("/api/students", isAuthenticated, async (req, res) => {
    try {
      const { batchId } = req.query;

      // If batchId is provided, return students for that batch
      if (batchId) {
        const students = await storage.getStudentsByBatch(batchId as string);
        return res.json(students);
      }

      // If user is parent, return only their students
      if (req.user && req.user.role === "parent") {
        const students = await storage.getStudentsByParent(req.user.id);
        return res.json(students);
      }

      const students = await storage.getStudents();
      res.json(students);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/students/:id", isAuthenticated, async (req, res) => {
    try {
      const student = await storage.getStudent(parseInt(req.params.id));
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Check if parent is requesting their own student
      if (req.user && req.user.role === "parent" && student.parentId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      res.json(student);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/students", isAdmin, async (req, res) => {
    try {
      const student = await storage.createStudent(req.body);
      res.status(201).json(student);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/students/:id", isAdmin, async (req, res) => {
    try {
      const updatedStudent = await storage.updateStudent(parseInt(req.params.id), req.body);
      if (!updatedStudent) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(updatedStudent);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/students/:id", isAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteStudent(parseInt(req.params.id));
      if (!deleted) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Enrollments routes
  app.get("/api/enrollments", isAuthenticated, async (req, res) => {
    try {
      const enrollments = await storage.getEnrollments();
      res.json(enrollments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/enrollments/student/:studentId", isAuthenticated, async (req, res) => {
    try {
      const student = await storage.getStudent(parseInt(req.params.studentId));
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Check if parent is requesting their own student's enrollments
      if (req.user && req.user.role === "parent" && student.parentId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const enrollments = await storage.getEnrollmentsByStudent(parseInt(req.params.studentId));
      res.json(enrollments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/enrollments", isAdmin, async (req, res) => {
    try {
      const enrollment = await storage.createEnrollment(req.body);
      res.status(201).json(enrollment);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Attendance routes
  app.get("/api/attendance/enrollment/:enrollmentId", isAuthenticated, async (req, res) => {
    try {
      const enrollment = await storage.getEnrollment(parseInt(req.params.enrollmentId));
      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }

      const student = await storage.getStudent(enrollment.studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Check if parent is requesting their own student's attendance
      if (req.user && req.user.role === "parent" && student.parentId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const attendance = await storage.getAttendanceByEnrollment(parseInt(req.params.enrollmentId));
      res.json(attendance);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/attendance", isAuthenticated, async (req, res) => {
    try {
      // Only teachers and admin can mark attendance
      if (!req.user || (req.user.role !== "admin" && req.user.role !== "teacher")) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const attendance = await storage.createAttendance(req.body);
      res.status(201).json(attendance);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Payments routes
  app.get("/api/payments", isAuthenticated, async (req, res) => {
    try {
      if (req.user && req.user.role === "parent") {
        const students = await storage.getStudentsByParent(req.user.id);
        const studentIds = students.map(student => student.id);
        const allPayments = await storage.getPayments();
        const payments = allPayments.filter(payment => studentIds.includes(payment.studentId));
        return res.json(payments);
      }

      const payments = await storage.getPayments();
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/payments/student/:studentId", isAuthenticated, async (req, res) => {
    try {
      const student = await storage.getStudent(parseInt(req.params.studentId));
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Check if parent is requesting their own student's payments
      if (req.user && req.user.role === "parent" && student.parentId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const payments = await storage.getPaymentsByStudent(parseInt(req.params.studentId));
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/payments", isAdmin, async (req, res) => {
    try {
      const payment = await storage.createPayment(req.body);
      res.status(201).json(payment);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/payments/:id", isAdmin, async (req, res) => {
    try {
      const updatedPayment = await storage.updatePayment(parseInt(req.params.id), req.body);
      if (!updatedPayment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      res.json(updatedPayment);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Employees routes
  app.get("/api/employees", isAdmin, async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/employees/:id", isAdmin, async (req, res) => {
    try {
      const employee = await storage.getEmployee(parseInt(req.params.id));
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/employees", isAdmin, async (req, res) => {
    try {
      const employee = await storage.createEmployee(req.body);
      res.status(201).json(employee);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/employees/:id", isAdmin, async (req, res) => {
    try {
      const updatedEmployee = await storage.updateEmployee(parseInt(req.params.id), req.body);
      if (!updatedEmployee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(updatedEmployee);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Payroll routes
  app.get("/api/payrolls", isAdmin, async (req, res) => {
    try {
      const payrolls = await storage.getPayrolls();
      res.json(payrolls);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/payrolls/employee/:employeeId", isAdmin, async (req, res) => {
    try {
      const payrolls = await storage.getPayrollsByEmployee(parseInt(req.params.employeeId));
      res.json(payrolls);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/payrolls", isAdmin, async (req, res) => {
    try {
      const payroll = await storage.createPayroll(req.body);
      res.status(201).json(payroll);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/payrolls/:id", isAdmin, async (req, res) => {
    try {
      const updatedPayroll = await storage.updatePayroll(parseInt(req.params.id), req.body);
      if (!updatedPayroll) {
        return res.status(404).json({ message: "Payroll not found" });
      }
      res.json(updatedPayroll);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Messages routes
  app.get("/api/messages", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const receivedMessages = await storage.getMessagesByReceiver(req.user.id);
      const sentMessages = await storage.getMessagesBySender(req.user.id);

      res.json({ received: receivedMessages, sent: sentMessages });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/messages", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const message = await storage.createMessage({
        ...req.body,
        senderId: req.user.id
      });
      res.status(201).json(message);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/messages/:id/read", isAuthenticated, async (req, res) => {
    try {
      const message = await storage.getMessage(parseInt(req.params.id));
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Only the receiver can mark a message as read
      if (message.receiverId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updatedMessage = await storage.updateMessage(parseInt(req.params.id), {
        readAt: new Date(),
        status: "read"
      });

      res.json(updatedMessage);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Branches routes
  app.get("/api/branches", isAuthenticated, async (req, res) => {
    try {
      const branches = await storage.getBranches();
      res.json(branches);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/branches/:id", isAuthenticated, async (req, res) => {
    try {
      const branch = await storage.getBranch(parseInt(req.params.id));
      if (!branch) {
        return res.status(404).json({ message: "Branch not found" });
      }
      res.json(branch);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/branches", isAdmin, async (req, res) => {
    try {
      const branch = await storage.createBranch(req.body);
      res.status(201).json(branch);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/branches/:id", isAdmin, async (req, res) => {
    try {
      const updatedBranch = await storage.updateBranch(parseInt(req.params.id), req.body);
      if (!updatedBranch) {
        return res.status(404).json({ message: "Branch not found" });
      }
      res.json(updatedBranch);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/branches/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid branch ID" });
      }

      const branch = await storage.getBranch(id);
      if (!branch) {
        return res.status(404).json({ message: "Branch not found" });
      }

      const deleted = await storage.deleteBranch(id);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete branch" });
      }

      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Student API routes
  app.get("/api/student/courses", isAuthenticated, isStudent, async (req, res) => {
    try {
      // For our mock data, we'll provide sample courses directly for student users
      const courses = [
        {
          id: 1,
          name: "Guitar Lessons",
          category: "music",
          teacherId: 1,
          teacherName: "Sini",
          schedule: "Monday, Wednesday - 4:00 PM to 5:30 PM",
          duration: "12 weeks",
          progress: "Week 3",
          status: "Active"
        },
        {
          id: 2,
          name: "Piano ",
          category: "music",
          teacherId: 2,
          teacherName: "Sarah Wilson",
          schedule: "Tuesday, Friday - 5:00 PM to 6:00 PM",
          duration: "8 weeks",
          progress: "Week 4",
          status: "Active"
        },
        {
          id: 3,
          name: "Gymnastics ",
          category: "dance",
          teacherId: 3,
          teacherName: "Jenet",
          schedule: "Tuesday, Friday - 5:00 PM to 6:00 PM",
          duration: "8 weeks",
          progress: "Week 5",
          status: "Active"
        },
        // {
        //   id: 4,
        //   name: "Contemporary Dance ",
        //   category: "dance",
        //   teacherId: 4,
        //   teacherName: "Sini",
        //   schedule: "Tuesday, Friday - 5:00 PM to 6:00 PM",
        //   duration: "8 weeks",
        //   progress: "Week 4",
        //   status: "Active"
        // },
        // {
        //   id: 5,
        //   name: "Bollywood Fitness ",
        //   category: "fitness",
        //   teacherId: 5,
        //   teacherName: "Jenet",
        //   schedule: "Tuesday, Friday - 5:00 PM to 6:00 PM",
        //   duration: "8 weeks",
        //   progress: "Week 4",
        //   status: "Active"
        // },
        // {
        //   id: 6,
        //   name: "Zumba",
        //   category: "fitness",
        //   teacherId: 6,
        //   teacherName: "Sini",
        //   schedule: "Tuesday, Friday - 5:00 PM to 6:00 PM",
        //   duration: "8 weeks",
        //   progress: "Week 4",
        //   status: "Active"
        // },
        // {
        //   id: 7,
        //   name: "Fine Arts",
        //   category: "Fine Arts",
        //   teacherId: 7,
        //   teacherName: "Sneha",
        //   schedule: "Tuesday, Friday - 5:00 PM to 6:00 PM",
        //   duration: "8 weeks",
        //   progress: "Week 4",
        //   status: "Active"
        // },
        // {
        //   id: 8,
        //   name: "Specialized Fine Arts",
        //   category: "Fine Arts",
        //   teacherId: 8,
        //   teacherName: "Sneha",
        //   schedule: "Tuesday, Friday - 5:00 PM to 6:00 PM",
        //   duration: "8 weeks",
        //   progress: "Week 4",
        //   status: "Active"
        // }
      ];

      res.json(courses);
    } catch (error: any) {
      console.error("Error fetching student courses:", error);
      res.status(500).json({ error: "Failed to fetch courses", message: error.message });
    }
  });

  app.get("/api/student/attendance-stats", isAuthenticated, isStudent, async (req, res) => {
    try {
      // Mock attendance statistics for student view
      const attendanceStats = {
        attendanceRate: "92%",
        attendanceDays: 24,
        present: 22,
        absent: 1,
        late: 1,
        excused: 0
      };

      res.json(attendanceStats);
    } catch (error: any) {
      console.error("Error fetching attendance stats:", error);
      res.status(500).json({ error: "Failed to fetch attendance statistics", message: error.message });
    }
  });

  app.get("/api/student/upcoming-classes", isAuthenticated, isStudent, async (req, res) => {
    try {
      // Mock upcoming classes data
      const today = new Date();
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const currentDay = today.getDay();
      
      const upcomingClasses = [
        {
          id: 1,
          courseName: "Guitar Lessons",
          teacherName: "John Smith",
          date: `${dayNames[(currentDay + 1) % 7]}, ${new Date(today.getTime() + 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          time: "4:00 PM - 5:30 PM",
          room: "Studio A"
        },
        {
          id: 1,
          courseName: "Guitar Lessons",
          teacherName: "John Smith",
          date: `${dayNames[(currentDay + 3) % 7]}, ${new Date(today.getTime() + 86400000 * 3).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          time: "4:00 PM - 5:30 PM",
          room: "Studio A"
        },
        {
          id: 2,
          courseName: "Music Theory",
          teacherName: "Sarah Wilson",
          date: `${dayNames[(currentDay + 2) % 7]}, ${new Date(today.getTime() + 86400000 * 2).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          time: "5:00 PM - 6:00 PM",
          room: "Room 101"
        },
        {
          id: 2,
          courseName: "Music Theory",
          teacherName: "Sarah Wilson",
          date: `${dayNames[(currentDay + 5) % 7]}, ${new Date(today.getTime() + 86400000 * 5).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          time: "5:00 PM - 6:00 PM",
          room: "Room 101"
        }
      ];

      // Sort by date/time
      upcomingClasses.sort((a, b) => {
        const dateA = new Date(a.date.split(', ')[1] + " " + a.time.split(' - ')[0]);
        const dateB = new Date(b.date.split(', ')[1] + " " + b.time.split(' - ')[0]);
        return dateA.getTime() - dateB.getTime();
      });

      res.json(upcomingClasses);
    } catch (error: any) {
      console.error("Error fetching upcoming classes:", error);
      res.status(500).json({ error: "Failed to fetch upcoming classes", message: error.message });
    }
  });

  app.get("/api/student/payments", isAuthenticated, isStudent, async (req, res) => {
    try {
      // Mock payments data for student view
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 15);
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 15);
      
      const payments = [
        {
          id: 101,
          invoiceId: "INV-2023-101",
          courseName: "Guitar Lessons",
          amount: 450.00,
          dueDate: nextMonth.toISOString().split('T')[0],
          status: "Pending"
        },
        {
          id: 100,
          invoiceId: "INV-2023-100",
          courseName: "Guitar Lessons",
          amount: 450.00,
          dueDate: today.toISOString().split('T')[0],
          status: "Paid"
        },
        {
          id: 99,
          invoiceId: "INV-2023-099",
          courseName: "Music Theory",
          amount: 350.00,
          dueDate: lastMonth.toISOString().split('T')[0],
          status: "Paid"
        }
      ];

      res.json(payments);
    } catch (error: any) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ error: "Failed to fetch payments", message: error.message });
    }
  });

  app.get("/api/student/attendance", isAuthenticated, isStudent, async (req, res) => {
    try {
      // Mock attendance records data
      const today = new Date();
      const oneDay = 24 * 60 * 60 * 1000; // milliseconds in one day
      
      const attendanceRecords = [
        {
          id: 301,
          date: new Date(today.getTime() - (oneDay * 1)).toISOString().split('T')[0],
          courseName: "Guitar Lessons",
          teacherName: "Sini",
          status: "present",
          remarks: ""
        },
        {
          id: 300,
          date: new Date(today.getTime() - (oneDay * 3)).toISOString().split('T')[0],
          courseName: "Gymnastics",
          teacherName: "Jenet",
          status: "present",
          remarks: ""
        },
        {
          id: 299,
          date: new Date(today.getTime() - (oneDay * 6)).toISOString().split('T')[0],
          courseName: "Zumba",
          teacherName: "Sini",
          status: "Late",
          remarks: "Arrived 10 minutes late"
        },
        {
          id: 298,
          date: new Date(today.getTime() - (oneDay * 8)).toISOString().split('T')[0],
          courseName: "Gymnastics",
          teacherName: "Jenet",
          status: "present",
          remarks: ""
        },
        {
          id: 297,
          date: new Date(today.getTime() - (oneDay * 10)).toISOString().split('T')[0],
          courseName: "Guitar Lessons",
          teacherName: "Sini",
          status: "present",
          remarks: ""
        },
        {
          id: 296,
          date: new Date(today.getTime() - (oneDay * 12)).toISOString().split('T')[0],
          courseName: "Zumba",
          teacherName: "Jenet",
          status: "absent",
          remarks: "Sick"
        },
        {
          id: 295,
          date: new Date(today.getTime() - (oneDay * 14)).toISOString().split('T')[0],
          courseName: "Gymnastics",
          teacherName: "Jenet",
          status: "present",
          remarks: ""
        },
        {
          id: 294,
          date: new Date(today.getTime() - (oneDay * 16)).toISOString().split('T')[0],
          courseName: "Guitar Lessons",
          teacherName: "Sini",
          status: "present",
          remarks: ""
        },
      ];

      // Sort attendance records by date (newest first)
      attendanceRecords.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      res.json(attendanceRecords);
    } catch (error: any) {
      console.error("Error fetching attendance records:", error);
      res.status(500).json({ error: "Failed to fetch attendance records", message: error.message });
    }
  });

  // Get student attendance records
  app.get("/api/student/attendance", isAuthenticated, async (req, res) => {
    try {
      const courseId = req.query.course as string;
      const date = req.query.date as string;
      
      // Get all enrollments for the student
      const enrollments = await storage.getEnrollments();
      const studentEnrollments = enrollments.filter(e => e.studentId === req.user.id);
      
      // Get all batches
      const batches = await storage.getBatches();
      
      // Get all attendance records
      let attendance = await storage.getAttendance();
      
      // Filter attendance records for the student's enrollments
      attendance = attendance.filter(a => 
        studentEnrollments.some(e => e.id === a.enrollmentId)
      );
      
      // Filter by course if specified
      if (courseId && courseId !== "all") {
        const courseEnrollments = studentEnrollments.filter(e => {
          const batch = batches.find(b => b.id === e.batchId);
          return batch?.courseId.toString() === courseId;
        });
        attendance = attendance.filter(a =>
          courseEnrollments.some(e => e.id === a.enrollmentId)
        );
      }
      
      // Filter by month if specified
      if (date) {
        const [year, month] = date.split("-");
        attendance = attendance.filter(a => {
          const attendanceDate = new Date(a.date);
          return (
            attendanceDate.getFullYear() === parseInt(year) &&
            attendanceDate.getMonth() === parseInt(month) - 1
          );
        });
      }
      
      // Enrich attendance data with course and teacher info
      const enrichedAttendance = await Promise.all(
        attendance.map(async (record) => {
          const enrollment = studentEnrollments.find(e => e.id === record.enrollmentId);
          const batch = enrollment ? batches.find(b => b.id === enrollment.batchId) : null;
          const course = batch ? await storage.getCourse(batch.courseId) : null;
          const teacher = batch ? await storage.getUser(batch.teacherId) : null;
          
          return {
            ...record,
            courseName: course?.name || "Unknown Course",
            teacherName: teacher?.fullName || "Unknown Teacher",
            batchName: batch?.name || "Unknown Batch"
          };
        })
      );
      
      res.json(enrichedAttendance);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Teacher-specific attendance routes
  app.get("/api/teacher/batches", isAuthenticated, isTeacher, async (req, res) => {
    try {
      const teacherId = req.user!.id;
      const teacher = await storage.getEmployeeByEmployeeId("EMP00" + teacherId);

      if (!teacher) {
        return res.status(404).json({ message: "Teacher record not found" });
      }

      // Get batches taught by this teacher
      const batches = await storage.getBatchesByTeacher(teacher.id);

      // Augment batches with course info
      const batchesWithCourseInfo = [];

      for (const batch of batches) {
        const course = await storage.getCourse(batch.courseId);
        batchesWithCourseInfo.push({
          ...batch,
          courseName: course ? course.name : "Unknown Course",
          time: `${batch.startTime} - ${batch.endTime}`
        });
      }

      res.json(batchesWithCourseInfo);
    } catch (error: any) {
      console.error("Error fetching teacher batches:", error);
      res.status(500).json({ error: "Failed to fetch batches", message: error.message });
    }
  });

  // Get students in a specific batch
  app.get("/api/teacher/batch/students/:batchId", isAuthenticated, isTeacher, async (req, res) => {
    try {
      const teacherId = req.user!.id;
      const teacher = await storage.getEmployeeByEmployeeId("EMP00" + teacherId);

      if (!teacher) {
        return res.status(404).json({ message: "Teacher record not found" });
      }

      const batchId = parseInt(req.params.batchId);

      // Verify this teacher teaches this batch
      const batch = await storage.getBatch(batchId);
      if (!batch || batch.teacherId !== teacher.id) {
        return res.status(403).json({ message: "You do not have permission to access this batch" });
      }

      // Get students in this batch
      const enrollments = await storage.getEnrollmentsByBatch(batchId);
      const students = [];

      for (const enrollment of enrollments) {
        const student = await storage.getStudent(enrollment.studentId);
        if (student) {
          // Use the student's id if userId doesn't exist
          const user = await storage.getUser(student.id);
          students.push({
            id: student.id,
            studentId: student.studentId,
            name: user ? user.fullName : "Unknown Student",
            enrollmentId: enrollment.id
          });
        }
      }

      res.json(students);
    } catch (error: any) {
      console.error("Error fetching batch students:", error);
      res.status(500).json({ error: "Failed to fetch students", message: error.message });
    }
  });

  // Get attendance for a specific batch on a specific date
  app.get("/api/teacher/attendance", isAuthenticated, isTeacher, async (req, res) => {
    try {
      const teacherId = req.user!.id;
      const teacher = await storage.getEmployeeByEmployeeId("EMP00" + teacherId);

      if (!teacher) {
        return res.status(404).json({ message: "Teacher record not found" });
      }

      const { batchId, date } = req.query;

      if (!batchId || batchId === 'all') {
        return res.json([]);
      }

      // Verify this teacher teaches this batch
      const batch = await storage.getBatch(parseInt(batchId as string));
      if (!batch || batch.teacherId !== teacher.id) {
        return res.status(403).json({ message: "You do not have permission to access this batch" });
      }

      // Parse date
      const selectedDate = date ? new Date(date as string) : new Date();

      // Get enrollments for this batch
      const enrollments = await storage.getEnrollmentsByBatch(parseInt(batchId as string));

      // Get attendance records for the specified date
      const allAttendanceRecords = await storage.getAttendanceByDate(selectedDate);

      // Filter attendance records for this batch's enrollments
      const attendanceRecords = [];

      for (const enrollment of enrollments) {
        const records = allAttendanceRecords.filter(a => a.enrollmentId === enrollment.id);

        for (const record of records) {
          const student = await storage.getStudent(enrollment.studentId);
          if (student) {
            // Use the student's id if userId doesn't exist
            const user = await storage.getUser(student.id);
            attendanceRecords.push({
              id: record.id,
              enrollmentId: record.enrollmentId,
              studentId: student.id,
              studentName: user ? user.fullName : "Unknown Student",
              date: record.date,
              status: record.status,
              remarks: record.remarks
            });
          }
        }
      }

      res.json(attendanceRecords);
    } catch (error: any) {
      console.error("Error fetching attendance records:", error);
      res.status(500).json({ error: "Failed to fetch attendance records", message: error.message });
    }
  });

  // Admin payments/invoices routes
  app.get("/api/payments", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const payments = await storage.getPayments();
      const formattedPayments = [];

      for (const payment of payments) {
        const student = await storage.getStudent(payment.studentId);
        let studentName = `Student #${payment.studentId}`;

        if (student) {
          // Use the student's id if userId doesn't exist
          const user = await storage.getUser(student.id);
          if (user) {
            studentName = user.fullName;
          }
        }

        formattedPayments.push({
          ...payment,
          studentName
        });
      }

      res.json(formattedPayments);
    } catch (error: any) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ error: "Failed to fetch payments", message: error.message });
    }
  });

  app.post("/api/payments", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const payment = await storage.createPayment(req.body);
      res.status(201).json(payment);
    } catch (error: any) {
      console.error("Error creating payment:", error);
      res.status(500).json({ error: "Failed to create payment", message: error.message });
    }
  });

  app.put("/api/payments/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const updatedPayment = await storage.updatePayment(paymentId, req.body);

      if (!updatedPayment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      res.json(updatedPayment);
    } catch (error: any) {
      console.error("Error updating payment:", error);
      res.status(500).json({ error: "Failed to update payment", message: error.message });
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // User management routes
  app.get("/api/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { username, email, password, fullName, role } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash the password before storing
      const hashedPassword = await hashPassword(password);
      
      const newUser = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        fullName,
        role: role || "student",
        address: req.body.address || null,
        phone: req.body.phone || null,
        branch: req.body.branch || null,
        // profilePicture: req.body.profilePicture || null
      });

      res.status(201).json(newUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updatedUser = await storage.updateUser(userId, req.body);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Prevent deleting own account
      if (req.user && req.user.id === userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      const success = await storage.deleteUser(userId);
      
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/reset-password/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { newPassword } = req.body;
      
      if (!newPassword) {
        return res.status(400).json({ message: "New password is required" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const hashedPassword = await hashPassword(newPassword);
      const updated = await storage.updateUserPassword(user.username, hashedPassword);
      
      if (!updated) {
        return res.status(500).json({ message: "Failed to update password" });
      }
      
      res.json({ message: "Password reset successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Allow users to change their own password
  app.post("/api/change-password", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }
      
      // Verify current password
      if (!(await comparePasswords(currentPassword, user.password))) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      
      // Update to new password
      const hashedPassword = await hashPassword(newPassword);
      const updated = await storage.updateUserPassword(user.username, hashedPassword);
      
      if (!updated) {
        return res.status(500).json({ message: "Failed to update password" });
      }
      
      res.json({ message: "Password changed successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}