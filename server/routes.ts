import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword, comparePasswords } from "./auth";
import { parents, User, users, invoices, students, employees, roles, studentInventory, studentCourseFee, stockItem, studentEnrollmentFees, transportation as transportationTable, enrollments as enrollmentsTable } from "@shared/schema";
import { sendEmail } from "./email/emailNotification";
import { db } from "./db";
import { and, eq, gt, sql } from "drizzle-orm";
import crypto from "crypto";
import dotenv from "dotenv";
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';


dotenv.config();
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
    res.status(403).json({ message: "Forbiddennn" });
  };

  const isBranchAdmin = (req: any, res: any, next: any) => {
    if (req.isAuthenticated() && req.user.role === "branch_admin") {
      return next();
    }
    res.status(403).json({ message: "Forbidden" });
  };

  const isAdminOrBranchAdmin = (req: any, res: any, next: any) => {
    if (
      req.isAuthenticated() &&
      (req.user.role === "admin" || req.user.role === "branch_admin")
    ) {
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

  const hasPermission = (module: string, action: string) => {
    return async (req: any, res: any, next: any) => {
      try {
        if (!req.isAuthenticated()) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        const userRoleName = req.user.role;
        const roleData = await db.select()
          .from(roles)
          .where(eq(roles.name, userRoleName))
          .limit(1);

        if (roleData.length === 0) {
          return res.status(403).json({ message: "Role definition not found" });
        }

        const permissionsData = roleData[0].permissions as Record<string, string[]>;

        if (permissionsData && permissionsData[module] && permissionsData[module].includes(action)) {
          return next();
        }

        return res.status(403).json({ message: "Forbidden: insufficient permissions" });
      } catch (error) {
        console.error("Permission middleware error:", error);
        return res.status(500).json({ message: "Internal server error" });
      }
    };
  };

  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as { role: string; branch: string };
      const { role, branch } = user;

      // Use enriched student data with branch
      let students = await storage.getStudentsWithBranch();
      let payments = await storage.getInvoices();
      let batches = await storage.getBatches();

      // For branch_admin, filter only students from their branch
      if (role === "branch_admin") {
        students = students.filter((s) => s.branch_name === branch);

        const studentIds = students.map((s) => s.student_id);
        payments = payments.filter((p) => studentIds.includes(p.studentId));
        batches = batches.filter((b) => b.branch === branch);
      }

      const totalRevenue = payments
        .filter((p) => p.status === "paid" || p.status === "partially_paid")
        .reduce((acc, p) => acc + Number(p.totalAmount), 0);

      const pendingPayments = payments
        .filter((p) => p.status === "unpaid")
        .reduce((acc, p) => {
          const amount = p.status === "partially_paid"
            ? Number(p.totalAmount) - Number(p.amountPaid)
            : Number(p.totalAmount);
          return acc + amount;
        }, 0);

      const totalStudents = students.length;
      const activeStudents = students.filter((s) => s.status === "active").length;
      const activeBatches = batches.filter((b) => b.status === "active").length;

      res.json({
        totalRevenue,
        pendingPayments,
        totalStudents,
        activeStudents,
        activeBatches,
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
        { month: "Jun", revenue: 923450 },
      ];

      res.json(revenueData);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get(
    "/api/dashboard/student-distribution",
    isAuthenticated,
    async (req, res) => {
      try {
        const courseCategories = ["music", "dance", "art"];
        const courses = await storage.getCourses();
        const enrollments = await storage.getEnrollments();

        const distribution = {
          music: 0,
          dance: 0,
          art: 0,
          total: 0,
        };

        // Get course IDs for each category
        const musicCourseIds = courses
          .filter((course) => course.category === "music")
          .map((course) => course.id);
        const danceCourseIds = courses
          .filter((course) => course.category === "dance")
          .map((course) => course.id);
        const artCourseIds = courses
          .filter((course) => course.category === "art")
          .map((course) => course.id);

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
    }
  );

  app.get(
    "/api/dashboard/recent-transactions",
    isAuthenticated,
    async (req, res) => {
      try {
        const payments = await storage.getPayments();
        const recentPayments = payments
          .sort((a, b) => {
            return (
              new Date(b.paymentDate).getTime() -
              new Date(a.paymentDate).getTime()
            );
          })
          .slice(0, 5);

        const transactions = [];
        for (const payment of recentPayments) {
          const student = await storage.getStudent(payment.studentId);
          if (student) {
            const enrollments = await storage.getEnrollmentsByStudent(
              student.id
            );
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
              status: payment.status,
            });
          }
        }

        res.json(transactions);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  app.get("/api/dashboard/today-classes", isAuthenticated, async (req, res) => {
    try {
      const batches = await storage.getBatches(); // batches include schedules
      const today = new Date();
      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const todayDay = dayNames[today.getDay()];

      const todayClasses = [];

      for (const batch of batches) {
        if (batch.status !== "active") continue;

        // Filter schedules for today
        const todaySchedules = batch.schedules.filter(schedule => schedule.day === todayDay);


        for (const schedule of todaySchedules) {
          const course = await storage.getCourse(batch.courseId);
          const teacher = await storage.getEmployeeByEmployeeId(
            "EMP00" + batch.teacherId
          );
          const enrollments = await storage.getEnrollmentsByBatch(batch.id);

          if (course && teacher) {
            const user = await storage.getUser(teacher.userId);
            todayClasses.push({
              batchName: batch.name,
              courseCategory: course.category,
              startTime: schedule.startTime,
              day: schedule.day,
              endTime: schedule.endTime,
              location: batch.roomNumber,
              teacherName: user ? user.fullName : "Unknown Teacher",
              studentCount: enrollments.length,
            });
          }
        }
      }

      res.json(todayClasses);
    } catch (error) {
      console.error("Error fetching today's classes:", error);
      res.status(500).json({ error: "Failed to fetch today's classes" });
    }
  });

  // Courses routes
  app.get("/api/courses", hasPermission("courses", "view"), async (req, res) => {
    try {
      const courses = await storage.getCourses();
      res.json(courses);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/courses/:id", hasPermission("courses", "view"), async (req, res) => {
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

  app.post("/api/courses", hasPermission("courses", "create"), async (req, res) => {
    try {
      const course = await storage.createCourse(req.body);
      res.status(201).json(course);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/courses/:id", isAuthenticated, hasPermission("courses", "edit"), async (req, res) => {
    try {
      const updatedCourse = await storage.updateCourse(
        parseInt(req.params.id),
        req.body
      );
      if (!updatedCourse) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(updatedCourse);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/courses/:id", hasPermission("courses", "delete"), async (req, res) => {
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

  // Departments routes
  app.get("/api/departments", isAuthenticated, hasPermission("departments", "view"), async (req, res) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/departments/:id", isAuthenticated, hasPermission("departments", "view"), async (req, res) => {
    try {
      const department = await storage.getDepartment(parseInt(req.params.id));
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }
      res.json(department);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/departments", isAdminOrBranchAdmin, hasPermission("departments", "create"), async (req, res) => {
    try {
      const department = await storage.createDepartment(req.body);
      res.json(department);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/departments/:id", isAdminOrBranchAdmin, hasPermission("departments", "edit"), async (req, res) => {
    try {
      const department = await storage.updateDepartment(
        parseInt(req.params.id),
        req.body
      );
      res.json(department);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/departments/:id", isAdminOrBranchAdmin, hasPermission("departments", "delete"), async (req, res) => {
    try {
      const deleted = await storage.deleteDepartment(parseInt(req.params.id));
      if (!deleted) {
        return res.status(404).json({ message: "Department not found" });
      }
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Brand routes
  app.get("/api/brands", isAdminOrBranchAdmin, hasPermission("brands", "view"), async (req, res) => {
    try {
      const brands = await storage.getBrands();
      res.json(brands);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/brands/:id", isAdminOrBranchAdmin, hasPermission("brands", "view"), async (req, res) => {
    try {
      const brand = await storage.getBrand(parseInt(req.params.id));
      if (!brand) {
        return res.status(404).json({ message: "Brand not found" });
      }
      res.json(brand);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/brands", isAdminOrBranchAdmin, hasPermission("brands", "create"), async (req, res) => {
    try {
      const brand = await storage.createBrand(req.body);
      res.json(brand);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/brands/:id", isAdminOrBranchAdmin, hasPermission("brands", "edit"), async (req, res) => {
    try {
      const brand = await storage.updateBrand(
        parseInt(req.params.id),
        req.body
      );
      res.json(brand);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/brands/:id", isAdminOrBranchAdmin, hasPermission("brands", "delete"), async (req, res) => {
    try {
      const deleted = await storage.deleteBrand(parseInt(req.params.id));
      if (!deleted) {
        return res.status(404).json({ message: "Brand not found" });
      }
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // schedule routes
  app.get("/api/schedules", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const schedules = await storage.getSchedules();
      res.json(schedules);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/schedules/:id", isAuthenticated, async (req, res) => {
    try {
      const schedule = await storage.getSchedule(parseInt(req.params.id));
      res.json(schedule);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/schedules", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const schedule = await storage.createSchedule(req.body);
      res.json(schedule);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/schedules/:id", isAuthenticated, async (req, res) => {
    try {
      const schedule = await storage.updateSchedule(
        parseInt(req.params.id),
        req.body
      );
      res.json(schedule);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  app.delete("/api/batch/schedules/:id", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteBatchSchedule(parseInt(req.params.id));
      if (!deleted) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/schedules/:id", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteSchedule(parseInt(req.params.id));
      if (!deleted) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Studio routes
  app.get("/api/studio", isAuthenticated, hasPermission("studio", "view"), async (req, res) => {
    try {
      const studios = await storage.getStudios();
      res.json(studios);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/studio/:id", isAuthenticated, hasPermission("studio", "view"), async (req, res) => {
    try {
      const studio = await storage.getStudio(parseInt(req.params.id));
      res.json(studio);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/studio", isAuthenticated, hasPermission("studio", "create"), async (req, res) => {
    try {
      const studio = await storage.createStudio(req.body);
      res.status(201).json(studio);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/studio/:id", isAuthenticated, hasPermission("studio", "edit"), async (req, res) => {
    try {
      const result = await storage.updateStudio(
        parseInt(req.params.id),
        req.body
      );
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/studio/:id", isAuthenticated, hasPermission("studio", "delete"), async (req, res) => {
    try {
      const deleted = await storage.deleteStudio(parseInt(req.params.id));
      if (!deleted) {
        return res.status(404).json({ message: "studio not found" });
      }
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Batches routes
  // app.get("/api/batches", isAuthenticated, async (req, res) => {
  //   try {
  //     const batches = await storage.getBatches();
  //     res.json(batches);
  //   } catch (error: any) {
  //     res.status(500).json({ message: error.message });
  //   }
  // });

  app.get("/api/batches", isAuthenticated, hasPermission("batches", "view"), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { role, branch } = req.user;

      let batches;

      if (role === "branch_admin") {
        batches = await storage.getBatchesByBranch(branch!);
      } else {
        batches = await storage.getBatches();
      }

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
        const employee = employees.find((emp) => emp.userId === req.user?.id);

        if (employee) {
          // Get batches where this teacher is assigned
          const allBatches = await storage.getBatches();
          const teacherBatches = allBatches.filter(
            (batch) => batch.teacherId === employee.id
          );
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

  app.get("/api/batches/:id", isAuthenticated, hasPermission("batches", "view"), async (req, res) => {
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

  // Get batches by course and branch
  app.get("/api/batches/filter", async (req, res) => {
    try {
      const courseId = Number(req.query.courseId);
      const branch = req.query.branch as string;

      if (!courseId || !branch) {
        return res.status(400).json({ error: "courseId and branch are required query parameters" });
      }

      const filteredBatches = await storage.getBatchesByCourse(courseId);
      res.json(filteredBatches);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/batches/course", async (req, res) => {
    try {
      const courseId = Number(req.query.courseId);

      if (!courseId) {
        return res.status(400).json({ error: "courseId is required" });
      }

      const filteredBatches = await storage.getBatchesByCourse(courseId);
      res.json(filteredBatches);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/batches", isAdminOrBranchAdmin, hasPermission("batches", "create"), async (req, res) => {
    try {
      const course = await storage.getCourse(req.body.courseId);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }

      const branches = await storage.getBranches();
      const branch = branches.find((b) => b.name === req.body.branch);
      if (!branch) {
        return res.status(404).json({ message: "Branch not found" });
      }

      const existingBatches = await storage.getBatches();
      const branchBatches = existingBatches.filter(
        (b) => b.branch === branch.name
      );

      const courseCode = course.code.toUpperCase();
      const branchCode = branch.code.toUpperCase();

      const prefix = `${branchCode}${courseCode}`;
      console.log("Batch creation debug:", {
        requestBody: req.body,
        course,
        branch,
        existingBatches: branchBatches.map((b) => ({
          name: b.name,
          branch: b.branch,
          startsWithPrefix: b.name.toUpperCase().startsWith(prefix),
        })),
        prefix,
      });

      const matchingBatches = branchBatches
        .filter((b) => b.name.toUpperCase().startsWith(prefix))
        .map((b) => parseInt(b.name.slice(prefix.length)))
        .filter((n) => !isNaN(n));

      const serialNum = (
        matchingBatches.length > 0 ? Math.max(...matchingBatches) + 1 : 1001
      ).toString();

      const batchName = `${branchCode}${courseCode}${serialNum}`;

      const batchData = {
        ...req.body,
        name: batchName,
        branch: branch.name,
      };

      const batch = await storage.createBatch(batchData);
      res.status(201).json(batch);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/batches/:id", isAuthenticated, hasPermission("batches", "edit"), async (req, res) => {
    try {
      console.log("User:", req.user?.role);
      console.log("Batch update body:", req.body);

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

  app.delete("/api/batches/:id", isAdminOrBranchAdmin, hasPermission("batches", "delete"), async (req, res) => {
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
  app.get("/api/students", isAuthenticated, hasPermission("students", "view"), async (req, res) => {
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

      if (req.user && req.user.role === "branch_admin") {
        const students = await storage.getStudentsByBranch(req.user.branch as string);
        return res.json(students);
      }

      const students = await storage.getStudents();
      res.json(students);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/students/not-joined", isAuthenticated, hasPermission("students", "view"), async (req, res) => {
    try {
      const students = await storage.getNotJoinedStudents();
      res.json(students);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/students-with-parents", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const students = await storage.getStudentsWithParents(req.user.id);
      res.json(students);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/students/course-count", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const students = await storage.getStudentCourseCount(req.user.id);
      res.json(students);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/students/course", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const students = await storage.getStudentCourseDetails(req.user.id);
      console.log(students, '.................');

      res.json(students);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/students/:id", isAuthenticated, hasPermission("students", "view"), async (req, res) => {
    try {
      const student = await storage.getStudent(parseInt(req.params.id));
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Check if parent is requesting their own student
      if (
        req.user &&
        req.user.role === "parent" &&
        student.parentId !== req.user.id
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }

      res.json(student);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/student-count', isAuthenticated, async (req, res) => {
    const batchId = parseInt(req.query.batchId as string);

    if (isNaN(batchId)) {
      return res.status(400).json({ error: 'Invalid batchId' });
    }

    try {
      const count = await storage.getStudentCountByBatch(batchId);
      res.json({ studentCount: count });
    } catch (error) {
      console.error('Error fetching student count:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post("/api/students", isAdminOrBranchAdmin, hasPermission("students", "create"), async (req, res) => {
    try {
      // console.log("Sending to /api/students:", req.body);
      const student = await storage.createStudent(req.body);
      res.status(201).json(student);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/students/:id", isAdminOrBranchAdmin, hasPermission("students", "edit"), async (req, res) => {
    try {
      const updatedStudent = await storage.updateStudent(
        parseInt(req.params.id),
        req.body
      );
      if (!updatedStudent) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(updatedStudent);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/students/:studentId", isAuthenticated, isAdminOrBranchAdmin, async (req, res) => {
    const { studentId } = req.params;

    try {
      // Validate inputs
      if (!studentId) {
        return res.status(400).json({ error: "Missing studentId" });
      }

      // Run your DB update logic (adjust table/column names as needed)
      const updatedStudent = await db
        .update(students)
        .set({ studentId })
        .where(eq(students.studentId, studentId))
        .returning();

      if (!updatedStudent.length) {
        return res.status(404).json({ error: "Student not found" });
      }

      res.json(updatedStudent[0]);
    } catch (error) {
      console.error("Error updating student:", error);
      res.status(500).json({ error: "Failed to update student" });
    }
  });

  app.delete("/api/students/:id", isAdminOrBranchAdmin, hasPermission("students", "delete"), async (req, res) => {
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

  // Student enrollment transactional route
  app.post("/api/students/enroll-transactional", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const {
        studentIdToUpdate,
        studentData,
        enrollments,
        inventoryItems,
        transportation,
        feeSummary
      } = req.body;

      const enrolledStudent = await db.transaction(async (tx) => {

        const updatedStudent = studentIdToUpdate
          ? await tx
            .update(students)
            .set({ ...studentData, updatedAt: new Date() })
            .where(eq(students.id, studentIdToUpdate))
            .returning()
            .then(res => res[0])
          : await tx
            .insert(students)
            .values({ ...studentData, createdAt: new Date() })
            .returning()
            .then(res => res[0]);

        // console.log("✅ updatedStudent", updatedStudent);

        if (!updatedStudent || !updatedStudent.id) {
          throw new Error("Failed to insert or update student");
        }

        // console.log("✅ enrollments", enrollments);

        for (const item of enrollments) {
          const inserted = await tx
            .insert(enrollmentsTable)
            .values({
              studentId: updatedStudent.id,
              ...item.enrollment
            })
            .returning() as { id: number }[];

          const [newEnrollment] = inserted;

          if (!newEnrollment) {
            throw new Error("Failed to create enrollment record");
          }

          if (item.fee) {
            await tx.insert(studentCourseFee).values({
              enrollmentId: newEnrollment.id,
              ...item.fee,
            });
          }
        }

        // console.log("✅ inventoryItems", inventoryItems);

        for (const item of inventoryItems) {
          console.log('Updating stockItem:', item.inventoryId, 'Quantity to subtract:', item.quantity);
          await tx
            .insert(studentInventory)
            .values({
              studentId: updatedStudent.id,
              inventoryId: item.inventoryId,
              quantity: item.quantity,
              discountType: item.discountType,
              discountValue: item.discountValue,
              totalAmount: item.totalAmount,
            });

          console.log('Updating stockItem:', item.inventoryId, 'Quantity to subtract:', item.quantity);
          const updatedStockItem = await tx
            .update(stockItem)
            .set({
              stockQuantity: sql`${stockItem.stockQuantity} - ${item.quantity}`
            })
            .where(eq(stockItem.stockItemId, item.inventoryId));

          console.log('Updated stockItem:', updatedStockItem);
        }

        // console.log("✅ transportation", transportation);
        if (transportation) {
          await tx.insert(transportationTable).values({ studentId: updatedStudent.id, ...transportation });
        }

        if (feeSummary) {
          await tx
            .insert(studentEnrollmentFees)
            .values({
              studentId: updatedStudent.id,
              ...feeSummary
            });
        }

        return updatedStudent;
      });

      res.status(201).json(enrolledStudent);

    } catch (error: any) {
      console.error("Enrollment transaction failed and was rolled back:", error);
      res.status(500).json({ message: error.message || "An error occurred during enrollment. No data was saved." });
    }
  });

  // Parent routes
  app.get("/api/parents", isAuthenticated, hasPermission("parents", "view"), async (req, res) => {
    try {
      const parents = await storage.getParents();
      res.json(parents);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/parents/:id", isAuthenticated, async (req, res) => {
    try {
      const parent = await storage.getParent(parseInt(req.params.id));
      if (!parent) {
        return res.status(404).json({ message: "Parent not found" });
      }
      res.json(parent);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/parents/user/:id", isAuthenticated, async (req, res) => {
    try {
      const parent = await storage.getParentByUserId(parseInt(req.params.id));
      if (!parent) {
        return res.status(404).json({ message: "Parent not found" });
      }
      res.json(parent);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // app.get("/api/parent/dashboard", isAuthenticated, isParent, async (req, res) => {
  //   try {
  //     if (!req.query.userId) {
  //       return res.status(400).json({ message: 'userId query parameter is missing' });
  //     }

  //     const userId = parseInt(req.query.userId as string, 10);
  //     if (isNaN(userId)) {
  //       return res.status(400).json({ message: 'Invalid userId' });
  //     }

  //     const count = await storage.getStudentCountByParentId(userId);

  //     res.json({ studentCount: count });
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).json({ message: 'Server error' });
  //   }
  // });

  // Parent dashboard endpoint
  app.get('/api/parents/dashboard', isAuthenticated, hasPermission("parents", "view"), async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      // Get the parent record for this user
      const [parent] = await db
        .select()
        .from(parents)
        .where(eq(parents.userId, userId));

      if (!parent) {
        return res.status(404).json({ message: 'Parent record not found' });
      }

      const childrenCount = await storage.getStudentCountByParentId(parent.id);
      return res.json({ count: childrenCount });
    } catch (error) {
      console.error('Error fetching parent dashboard:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get("/api/student-parents", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const students = await storage.getStudentCountByParentId(req.user.id);
      res.json(students);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/attendance/parent', isAuthenticated, async (req, res) => {
    const userId = parseInt(req.query.userId as string);
    const studentId = req.query.studentId as string | undefined;

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid parent user ID' });
    }

    try {
      // console.log('Fetching attendance for:', { userId, studentId });
      const result = await storage.getAttendanceByParentUserId(userId, studentId);
      res.json(result);
    } catch (error) {
      console.error('Error fetching parent attendance:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/attendance', isAuthenticated, hasPermission("attendance", "view"), async (req, res) => {
    const batchId = parseInt(req.query.batchId as string);
    const dateString = req.query.date as string;

    if (isNaN(batchId) || !dateString) {
      return res.status(400).json({ error: 'Invalid batchId or date' });
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    try {
      const records = await storage.getAttendanceByBatchAndDate(batchId, date);
      res.json(records);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/attendance/:studentId', isAuthenticated, async (req, res) => {
    const studentId = parseInt(req.params.studentId);

    if (isNaN(studentId)) {
      return res.status(400).json({ error: 'Invalid student ID' });
    }

    try {
      const result = await storage.getAttendanceByBatch(studentId);
      res.json(result);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post("/api/parents", isAdminOrBranchAdmin, hasPermission("parents", "create"), async (req, res) => {
    try {
      const parent = await storage.createParent(req.body);
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
      await db
        .update(users)
        .set({ resetToken, resetTokenExpires })
        .where(eq(users.email, parent.email!));
      const resetLink = `${process.env.VITE_API_BASE_URL}/reset/${resetToken}`;
      sendEmail(
        "resetParentPassword",
        parent?.email!,
        "Reset Parent Account Password",
        {
          name: parent.firstName,
          userName: parent.username,
          password: parent.password,
          resetLink,
        }
      );
      res.status(201).json(parent);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/parent/reset-password", async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
      return res
        .status(400)
        .json({ message: "Token and new password are required" });
    }
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.resetToken, token),
            gt(users.resetTokenExpires, new Date())
          )
        );

      if (!user) {
        return res
          .status(400)
          .json({ message: "Invalid or expired reset token" });
      }

      const hashedPassword = await hashPassword(password);
      await db
        .update(users)
        .set({
          password: hashedPassword,
          resetToken: null,
          resetTokenExpires: null,
        })
        .where(eq(users.id, user.id));
      await db
        .update(parents)
        .set({ password })
        .where(eq(parents.userId, user.id));

      res.status(200).json({ message: "Password reset successful" });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.put("/api/parents/:id", isAdminOrBranchAdmin, hasPermission("parents", "edit"), async (req, res) => {
    try {
      const updatedParent = await storage.updateParent(parseInt(req.params.id), req.body);
      if (!updatedParent) {
        return res.status(404).json({ message: "Parent not found" });
      }
      res.json(updatedParent);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/parents/:id", isAdminOrBranchAdmin, hasPermission("parents", "delete"), async (req, res) => {
    try {
      const deleted = await storage.deleteParent(parseInt(req.params.id));
      if (!deleted) {
        return res.status(404).json({ message: "Parent not found" });
      }
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/invoices/parent/:parentId', isAuthenticated, async (req, res) => {
    const parentId = parseInt(req.params.parentId, 10);

    if (isNaN(parentId)) {
      return res.status(400).json({ error: 'Invalid parent ID' });
    }

    const statusParam = req.query.status;
    let statuses: string[] | undefined;
    if (typeof statusParam === "string") {
      statuses = statusParam.split(",");
    }

    try {
      const invoices = await storage.getInvoicesByParentId(parentId, statuses);
      res.status(200).json(invoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });


  // Student Course Fee routes
  app.get("/api/studentCourseFees", isAuthenticated, async (req, res) => {
    try {
      const studentCourseFees = await storage.getStudentCourseFees();
      res.json(studentCourseFees);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/studentCourseFees/:enrollmentId", isAuthenticated, async (req, res) => {
    try {
      const studentCourseFees = await storage.getStudentCourseFees();
      res.json(studentCourseFees);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/studentCourseFees", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const studentCourseFee = await storage.createStudentCourseFee(req.body);
      res.status(201).json(studentCourseFee);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/studentCourseFees/:id", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const updatedStudentCourseFee = await storage.updateStudentCourseFee(
        parseInt(req.params.id),
        req.body
      );
      if (!updatedStudentCourseFee) {
        return res.status(404).json({ message: "Student Course Fee not found" });
      }
      res.json(updatedStudentCourseFee);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/studentCourseFees/:id", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteStudentCourseFee(parseInt(req.params.id));
      if (!deleted) {
        return res.status(404).json({ message: "Student Course Fee not found" });
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

  app.get("/api/enrollments/active", isAuthenticated, async (req, res) => {
    try {
      const enrollments = await storage.getActiveEnrollments();
      res.json(enrollments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/parents/:id/active-enrollments", isAuthenticated, isParent, async (req, res) => {
    try {
      const parentId = parseInt(req.params.id);
      const count = await storage.getActiveEnrollmentCountByParentId(parentId);
      res.json({ activeEnrollmentCount: count });
    } catch (error: any) {
      console.error("Error fetching active enrollments:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/enrollments/batch/:batchId", async (req, res) => {
    try {
      const batchId = parseInt(req.params.batchId);
      if (isNaN(batchId)) {
        return res.status(400).json({ message: "Invalid batch ID" });
      }

      const enrollments = await storage.getUniqueEnrollmentsByBatch(batchId);
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching filtered enrollments:", error);
      res.status(500).json({ message: "Failed to fetch enrollments" });
    }
  });

  app.post("/api/enrollments", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const enrollment = await storage.createEnrollment(req.body);
      res.status(201).json(enrollment);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/enrollments/deactivate", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const { studentId, batchId } = req.body;

      // Validate request
      if (!studentId || !batchId) {
        return res.status(400).json({ message: "studentId and batchId are required" });
      }

      const updatedEnrollments = await storage.deactivateStudentEnrollments(studentId, batchId);

      res.json({
        message: "Student enrollments deactivated successfully",
        updatedCount: updatedEnrollments.length,
        enrollments: updatedEnrollments,
      });
    } catch (error: any) {
      console.error("Failed to deactivate enrollments:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/enrollments/:id", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid enrollment ID" });
      }

      const enrollment = await storage.getEnrollment(id);
      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }

      const updatedEnrollment = await storage.updateEnrollment(id, req.body);
      if (!updatedEnrollment) {
        return res.status(500).json({ message: "Failed to update enrollment" });
      }

      res.json(updatedEnrollment);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  //Transportation routes
  app.get("/api/transportation", isAuthenticated, hasPermission("transportation", "view"), async (req, res) => {
    try {
      const transportation = await storage.getTransportations();
      res.json(transportation);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/transportation/:id", isAuthenticated, hasPermission("transportation", "view"), async (req, res) => {
    try {
      const transportation = await storage.getTransportation(
        parseInt(req.params.id)
      );
      if (!transportation) {
        return res
          .status(404)
          .json({ message: "Transportation record not found" });
      }
      res.json(transportation);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/transportation", isAuthenticated, hasPermission("transportation", "create"), async (req, res) => {
    try {
      // console.log("Received transportation data:", req.body);
      const transportation = await storage.createTransportation(req.body);
      // console.log("Created transportation record:", transportation);
      res.json(transportation);
    } catch (error: any) {
      console.error("Failed to create transportation:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Transportation mode routes
  app.get("/api/transportationModes", isAuthenticated, hasPermission("transportation", "view"), async (req, res) => {
    try {
      const transportationModes = await storage.getTransportationModes();
      res.json(transportationModes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/transportationMode", isAuthenticated, hasPermission("transportation", "create"), async (req, res) => {
    try {
      const transportationMode = await storage.createTransportationMode(req.body);
      res.status(201).json(transportationMode);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/transportationMode/:id", isAuthenticated, hasPermission("transportation", "edit"), async (req, res) => {
    try {
      const updatedTransportationMode = await storage.updateTransportationMode(parseInt(req.params.id), req.body);
      res.json(updatedTransportationMode);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/transportationMode/:id", isAuthenticated, hasPermission("transportation", "delete"), async (req, res) => {
    try {
      await storage.deleteTransportationMode(parseInt(req.params.id));
      res.json({ message: "Transportation mode deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  //Student Enrollment Fee routes
  app.get("/api/student_enrollment_fees", isAuthenticated, async (req, res) => {
    try {
      const enrollmentFees = await storage.getStudentEnrollmentFees();
      res.json(enrollmentFees);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/student_enrollment_fees", isAuthenticated, async (req, res) => {
    try {
      const enrollmentFee = await storage.createStudentEnrollmentFees(req.body);
      res.status(201).json(enrollmentFee);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/student_enrollment_fees/:id", isAuthenticated, async (req, res) => {
    try {
      const enrollmentFee = await storage.getStudentEnrollmentFees();
      if (!enrollmentFee) {
        return res.status(404).json({ message: "Enrollment fee not found" });
      }
      res.json(enrollmentFee);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/student_enrollment_fees/:id", isAuthenticated, async (req, res) => {
    try {
      const enrollmentFee = await storage.updateStudentEnrollmentFees(parseInt(req.params.id), req.body);
      res.json(enrollmentFee);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/student_enrollment_fees/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteStudentEnrollmentFees(parseInt(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Inventory routes
  app.get("/api/inventory", isAuthenticated, hasPermission("inventory", "view"), async (req, res) => {
    try {
      const inventory = await storage.getInventory();
      res.json(inventory);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/inventory", isAuthenticated, hasPermission("inventory", "create"), async (req, res) => {
    try {
      const inventory = await storage.createInventory(req.body);
      res.status(201).json(inventory);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/inventory/:id", isAuthenticated, hasPermission("inventory", "edit"), async (req, res) => {
    try {
      const inventory = await storage.updateInventory(
        parseInt(req.params.id),
        req.body
      );
      res.json(inventory);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/inventory/:id", isAuthenticated, hasPermission("inventory", "delete"), async (req, res) => {
    try {
      const inventory = await storage.deleteInventory(parseInt(req.params.id));
      res.json(inventory);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Stock Item routes
  app.get("/api/stock-item/:id", isAuthenticated, async (req, res) => {
    try {
      const stockItem = await storage.getStockItem(parseInt(req.params.id));
      res.json(stockItem);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/stock-item", isAuthenticated, async (req, res) => {
    try {
      const stockItem = await storage.getStockItems();
      res.json(stockItem);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/stock-item", isAuthenticated, async (req, res) => {
    try {
      const stockItem = await storage.createStockItem(req.body);
      res.status(201).json(stockItem);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/stock-item/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const input = req.body;

      // Convert date strings to Date objects for Drizzle
      const data = {
        ...input,
        ...(input.createdAt && { createdAt: new Date(input.createdAt) }),
        ...(input.updatedAt && { updatedAt: new Date(input.updatedAt) }),
      };

      const stockItem = await storage.updateStockItem(id, data);
      res.json(stockItem);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/stock-item/:id", isAuthenticated, async (req, res) => {
    try {
      const stockItem = await storage.deleteStockItem(parseInt(req.params.id));
      res.json(stockItem);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Student Inventory routes
  app.get("/api/studentInventory/:id", isAuthenticated, async (req, res) => {
    try {
      const inventory = await storage.getStudentInventory(parseInt(req.params.id));
      res.json(inventory);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/studentInventory", isAuthenticated, async (req, res) => {
    try {
      const inventory = await storage.getAllStudentInventory();
      res.json(inventory);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/studentInventory", isAuthenticated, async (req, res) => {
    try {
      const inventory = await storage.createStudentInventory(req.body);
      res.status(201).json(inventory);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/studentInventory/:id", isAuthenticated, async (req, res) => {
    try {
      const inventory = await storage.updateStudentInventory(parseInt(req.params.id), req.body);
      res.json(inventory);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/studentInventory/:id", isAuthenticated, async (req, res) => {
    try {
      const inventory = await storage.deleteStudentInventory(parseInt(req.params.id));
      res.json(inventory);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Attendance routes
  app.get(
    "/api/attendance/student/:studentId",
    isAuthenticated,
    async (req, res) => {
      try {
        const student = await storage.getStudent(parseInt(req.params.studentId));
        if (!student) {
          return res.status(404).json({ message: "Student not found" });
        }

        // Check if parent is requesting their own student's attendance
        if (
          req.user &&
          req.user.role === "parent" &&
          student.parentId !== req.user.id
        ) {
          return res.status(403).json({ message: "Forbidden" });
        }

        const attendance = await storage.getAttendanceByStudent(
          parseInt(req.params.studentId)
        );
        res.json(attendance);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  app.post("/api/attendance", isAuthenticated, async (req, res) => {
    try {
      // Only teachers and admin can mark attendance
      if (
        !req.user ||
        (req.user.role !== "admin" && req.user.role !== "teacher")
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const attendanceRecords = req.body;
      if (!Array.isArray(attendanceRecords)) {
        return res.status(400).json({ message: "Invalid attendance data format" });
      }

      // Validate each record
      for (const record of attendanceRecords) {
        if (!record.studentId || !record.batchId || !record.date || !record.status) {
          return res.status(400).json({
            message: "Each attendance record must have studentId, batchId, date, and status"
          });
        }
      }

      const savedAttendance = await Promise.all(
        attendanceRecords.map(record => storage.createAttendance(record))
      );

      res.status(201).json(savedAttendance);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/attendance/compensate', async (req, res) => {
    try {
      const { attendanceId, compensationDate, compensationBatchName } = req.body;

      if (!attendanceId || !compensationDate || !compensationBatchName) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Update the attendance record with compensation details
      await storage.updateAttendanceCompensation(attendanceId, compensationDate, compensationBatchName);

      res.json({ success: true });
    } catch (error) {
      console.error('Error updating compensation:', error);
      res.status(500).json({ error: 'Failed to update compensation' });
    }
  });

  // app.put('/api/attendance/:id', async (req, res) => {
  //   try {
  //     const { attendanceId, compensationDate, compensationBatchName } = req.body;

  //     if (!attendanceId || !compensationDate || !compensationBatchName) {
  //       return res.status(400).json({ error: 'Missing required fields' });
  //     }

  //     await storage.updateAttendance(attendanceId, compensationDate);

  //     res.json({ success: true });
  //   } catch (error) {
  //     console.error('Error updating compensation:', error);
  //     res.status(500).json({ error: 'Failed to update compensation' });
  //   }
  // });

  app.put('/api/attendance/:id', async (req, res) => {
    try {
      const attendanceId = req.params.id;
      const { compensationDate, compensationBatchName } = req.body;

      if (!attendanceId || !compensationDate) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (compensationBatchName) {
        // Update with compensation details
        await storage.updateAttendanceCompensation(parseInt(attendanceId), compensationDate, compensationBatchName);
      } else {
        // Regular attendance update
        await storage.updateAttendance(parseInt(attendanceId), compensationDate);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error updating attendance:', error);
      res.status(500).json({ error: 'Failed to update attendance' });
    }
  });

  // Payments routes
  app.get("/api/payments", isAuthenticated, async (req, res) => {
    try {
      if (req.user && req.user.role === "parent") {
        const students = await storage.getStudentsByParent(req.user.id);
        const studentIds = students.map((student) => student.id);
        const allPayments = await storage.getPayments();
        const payments = allPayments.filter((payment) =>
          studentIds.includes(payment.studentId)
        );
        return res.json(payments);
      }

      const payments = await storage.getPayments();
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // app.get(
  //   "/api/payments/student/:studentId",
  //   isAuthenticated,
  //   async (req, res) => {
  //     try {
  //       const student = await storage.getStudent(
  //         parseInt(req.params.studentId)
  //       );
  //       if (!student) {
  //         return res.status(404).json({ message: "Student not found" });
  //       }

  //       // Check if parent is requesting their own student's payments
  //       if (
  //         req.user &&
  //         req.user.role === "parent" &&
  //         student.parentId !== req.user.id
  //       ) {
  //         return res.status(403).json({ message: "Forbidden" });
  //       }

  //       const payments = await storage.getPaymentsByStudent(
  //         parseInt(req.params.studentId)
  //       );
  //       res.json(payments);
  //     } catch (error: any) {
  //       res.status(500).json({ message: error.message });
  //     }
  //   }
  // );

  app.get("/api/payments/invoice/:invoiceId", isAuthenticated, async (req, res) => {
    try {
      const { invoiceId } = req.params;

      const studentId = await storage.getStudentIdByInvoiceId(invoiceId);
      if (!studentId) {
        return res.status(404).json({ message: "Invoice not found." });
      }

      const invoiceData = await storage.getInvoiceDetails(studentId, invoiceId);

      if (!invoiceData) {
        return res.status(404).json({ message: "Could not assemble invoice details." });
      }

      res.json(invoiceData);
    } catch (err: any) {
      console.error("Error fetching invoice:", err);
      res.status(500).json({ message: "An internal server error occurred." });
    }
  });

  app.post("/api/payments", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const payment = await storage.createPayment(req.body);
      res.status(201).json(payment);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/payments/:id", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const updatedPayment = await storage.updatePayment(
        parseInt(req.params.id),
        req.body
      );
      if (!updatedPayment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      res.json(updatedPayment);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Invoices routes
  app.get("/api/invoices", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/invoices/:id", isAuthenticated, async (req, res) => {
    try {
      const invoice = await storage.getInvoiceWithItems(parseInt(req.params.id));
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/invoices/:invoiceNumber", isAdminOrBranchAdmin, async (req, res) => {
    const { invoiceNumber } = req.params;
    const { status, amount_paid } = req.body;

    try {
      if (!status || amount_paid === undefined) {
        return res.status(400).json({ error: "Missing status or amount_paid" });
      }

      const existingInvoice = await db
        .select()
        .from(invoices)
        .where(eq(invoices.invoiceNumber, invoiceNumber))
        .limit(1);

      if (!existingInvoice.length) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      const currentAmountPaid = Number(existingInvoice[0].amountPaid || 0);
      const newAmountPaid = currentAmountPaid + Number(amount_paid);

      const updatedInvoice = await db
        .update(invoices)
        .set({ status, amountPaid: newAmountPaid.toString() })
        .where(eq(invoices.invoiceNumber, invoiceNumber))
        .returning();

      if (!updatedInvoice.length) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      res.json(updatedInvoice[0]);
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(500).json({ error: "Failed to update invoice" });
    }
  });
  

  // app.post("/api/invoices", isAuthenticated, isAdmin, async (req, res) => {
  //   try {
  //     const invoice = await storage.createManualInvoiceWithLogic(req.body);
  //     res.status(201).json(invoice);
  //   } catch (error: any) {
  //     res.status(500).json({ message: error.message });
  //   }
  // });

  // app.post("/api/invoices", isAuthenticated, isAdmin, async (req, res) => {
  //   try {
  //     const { studentId } = req.body;
  //     if (!studentId) {
  //       return res.status(400).json({ message: "studentId is required" });
  //     }

  //     const createdInvoices = await storage.createManualInvoiceWithLogic(studentId);

  //     res.status(201).json(createdInvoices);
  //   } catch (error: any) {
  //     console.error("Invoice generation error:", error);
  //     res.status(500).json({ message: error.message || "An internal server error occurred during invoice generation." });
  //   }
  // });

  // app.post("/api/invoices/current-month", isAuthenticated, isAdmin, async (req, res) => {
  //   try {
  //     const { studentId } = req.body;
  //     if (!studentId) {
  //       return res.status(400).json({ message: "studentId is required" });
  //     }

  //     const invoice = await storage.createCurrentMonthInvoice(studentId);
  //     res.status(201).json(invoice);
  //   } catch (error: any) {
  //     console.error("Invoice generation error:", error);
  //     res.status(500).json({ message: error.message || "Internal server error" });
  //   }
  // });  

  app.post("/api/invoices", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const { studentId, mode = "manual", extraDiscount = 0 } = req.body;

      if (!studentId) {
        return res.status(400).json({ message: "studentId is required" });
      }

      let result;

      if (mode === "current") {
        result = await storage.createCurrentMonthInvoice(studentId);
      } else {
        result = await storage.createManualInvoiceWithLogic(studentId, extraDiscount);
      }

      res.status(201).json(result);
    } catch (error: any) {
      console.error("Invoice generation error:", error);
      res.status(500).json({
        message:
          error.message || "An internal server error occurred during invoice generation.",
      });
    }
  });

  app.put("/api/invoices/cancel/:id", async (req, res) => {
  const invoiceId = Number(req.params.id);
  // This console.log also needs backticks (`) to work correctly
  console.log(`🛑 Cancel invoice called: ${invoiceId}`);

  if (!invoiceId) {
    return res.status(400).json({ error: "Invalid invoice ID" });
  }

  try {
    const result = await storage.cancelInvoice(invoiceId);
    console.log(`🛑 Cancel invoice result: ${result}`);
    if (result) {
      res.status(200).json({ message: "Invoice cancelled successfully" });
    } else {
      res.status(404).json({ error: "Invoice not found or already cancelled" });
    }
  } catch (error: any) {
    console.error("❌ Failed to cancel invoice:", error);
    res.status(500).json({ error: "Failed to cancel invoice" });
  }
});




  app.get("/api/invoicesByStudent/:studentId", isAuthenticated, async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const invoices = await storage.getInvoicesByStudent(studentId);
      res.json(invoices);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/invoices/check", async (req, res) => {
    // console.log("Request body:", req.body);
    const { studentIds, month, year } = req.body;

    if (!Array.isArray(studentIds) || !month || !year) {
      return res.status(400).json({ error: "Missing or invalid parameters" });
    }

    try {
      const studentsWithInvoices = await storage.getStudentsWithInvoices(studentIds, month, year);
      res.json(studentsWithInvoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  // Receipt routes
  app.get("/api/receipts", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const receipts = await storage.getReceipts();
      res.json(receipts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/receipts/:id", isAuthenticated, async (req, res) => {
    try {
      const receipt = await storage.getReceiptByReceiptNumber(req.params.id);
      if (!receipt) {
        return res.status(404).json({ message: "Receipt not found" });
      }
      res.json(receipt);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/receipts", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const receiptNumber = await storage.generateReceiptId();
      const receipt = await storage.createReceipt({ ...req.body, receiptNumber });
      res.status(201).json(receipt);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/generate-receipt-number", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const receiptNumber = await storage.generateReceiptId();
      res.json({ receiptNumber });
    } catch (error) {
      res.status(500).json({ message: error });
    }
  });

  // Employees routes
  app.get("/api/employees", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/employees/:id", isAdminOrBranchAdmin, async (req, res) => {
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

  // Modified employee creation endpoint with password reset email
  app.post("/api/employees", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const employee = await storage.createEmployee(req.body);

      // Generate reset token for employee
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

      // Update user with reset token
      await db
        .update(users)
        .set({ resetToken, resetTokenExpires })
        .where(eq(users.email, employee.email!));

      // Create reset link
      const resetLink = `${process.env.VITE_API_BASE_URL}/reset/${resetToken}`;

      // Send password reset email to employee
      sendEmail(
        "resetEmployeePassword", // You'll need to create this email template
        employee?.email!,
        "Reset Employee Account Password",
        {
          name: employee.firstName,
          userName: employee.userName,
          password: employee.password,
          resetLink,
        }
      );

      res.status(201).json(employee);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/employees/:id", isAdminOrBranchAdmin, async (req, res) => {
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

  // Add this right before your parent routes to check route order
  app.delete("/api/employees/:id", isAdminOrBranchAdmin, async (req, res) => {
    console.log("DELETE /api/employees called with ID:", req.params.id); // Add this
    try {
      const employeeId = parseInt(req.params.id);
      console.log("Parsed ID:", employeeId); // Verify parsing

      const deleted = await storage.deleteEmployee(employeeId);
      console.log("Delete result:", deleted); // Check storage result

      if (!deleted) {
        console.log("Employee not found");
        return res.status(404).json({ message: "Employee not found" });
      }

      console.log("Employee deleted successfully");
      return res.sendStatus(204);
    } catch (error: any) {
      console.error("Delete error:", error);
      return res.status(500).json({ message: error.message });
    }
  });

  // Employee password reset endpoint
  app.post("/api/employee/reset-password", async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
      return res
        .status(400)
        .json({ message: "Token and new password are required" });
    }

    try {
      // Find user with valid reset token
      const [user] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.resetToken, token),
            gt(users.resetTokenExpires, new Date())
          )
        );

      if (!user) {
        return res
          .status(400)
          .json({ message: "Invalid or expired reset token" });
      }

      // Hash the new password
      const hashedPassword = await hashPassword(password);

      // Update user password and clear reset token
      await db
        .update(users)
        .set({
          password: hashedPassword,
          resetToken: null,
          resetTokenExpires: null,
        })
        .where(eq(users.id, user.id));

      // Update employee password (assuming you have an employees table)
      await db
        .update(employees)
        .set({ password })
        .where(eq(employees.userId, user.id));

      res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Optional: Manual trigger to send reset email to existing employee
  app.post("/api/employee/send-reset-email", isAdminOrBranchAdmin, async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    try {
      // Find employee by email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!user) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);

      // Update user with reset token
      await db
        .update(users)
        .set({ resetToken, resetTokenExpires })
        .where(eq(users.id, user.id));

      // Get employee details for email
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.userId, user.id));

      const resetLink = `${process.env.VITE_API_BASE_URL}/reset/${resetToken}`;

      // Send reset email
      sendEmail(
        "resetEmployeePassword",
        email,
        "Reset Employee Account Password",
        {
          name: employee.firstName,
          userName: user.username,
          resetLink,
        }
      );

      res.status(200).json({ message: "Reset email sent successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to send reset email" });
    }
  });
  app.put("/api/employees/:id", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const updatedEmployee = await storage.updateEmployee(
        parseInt(req.params.id),
        req.body
      );
      if (!updatedEmployee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(updatedEmployee);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Payroll routes
  app.get("/api/payrolls", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const payrolls = await storage.getPayrolls();
      res.json(payrolls);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/payrolls/employee/:employeeId", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const payrolls = await storage.getPayrollsByEmployee(
        parseInt(req.params.employeeId)
      );
      res.json(payrolls);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/payrolls", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const payroll = await storage.createPayroll(req.body);
      res.status(201).json(payroll);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/payrolls/:id", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const updatedPayroll = await storage.updatePayroll(
        parseInt(req.params.id),
        req.body
      );
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
        senderId: req.user.id,
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

      const updatedMessage = await storage.updateMessage(
        parseInt(req.params.id),
        {
          readAt: new Date(),
          status: "read",
        }
      );

      res.json(updatedMessage);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Branches routes
  app.get("/api/branches", async (req, res) => {
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

  app.post("/api/branches", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const branch = await storage.createBranch(req.body);
      res.status(201).json(branch);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/branches/:id", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const updatedBranch = await storage.updateBranch(
        parseInt(req.params.id),
        req.body
      );
      if (!updatedBranch) {
        return res.status(404).json({ message: "Branch not found" });
      }
      res.json(updatedBranch);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/branches/:id", isAdminOrBranchAdmin, async (req, res) => {
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

  // Branch-brand API routes
  app.get("/api/branch_brands", isAuthenticated, async (req, res) => {
    try {
      const branchBrands = await storage.getBranchBrands();
      res.json(branchBrands);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/branch_brands", isAuthenticated, async (req, res) => {
    try {
      const branchBrands = await storage.createBranchBrand(req.body);
      res.status(201).json(branchBrands);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/branch_brands/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid branch-brand ID" });
      }

      const branchBrand = await storage.getBranchBrands();
      if (!branchBrand) {
        return res.status(404).json({ message: "Branch-brand not found" });
      }

      const deleted = await storage.deleteBranchBrand(id);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete branch-brand" });
      }

      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Student API routes
  app.get(
    "/api/student/courses",
    isAuthenticated,
    isStudent,
    async (req, res) => {
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
            status: "Active",
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
            status: "Active",
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
            status: "Active",
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
        res
          .status(500)
          .json({ error: "Failed to fetch courses", message: error.message });
      }
    }
  );

  app.get(
    "/api/student/attendance-stats",
    isAuthenticated,
    isStudent,
    async (req, res) => {
      try {
        // Mock attendance statistics for student view
        const attendanceStats = {
          attendanceRate: "92%",
          attendanceDays: 24,
          present: 22,
          absent: 1,
          late: 1,
          excused: 0,
        };

        res.json(attendanceStats);
      } catch (error: any) {
        console.error("Error fetching attendance stats:", error);
        res.status(500).json({
          error: "Failed to fetch attendance statistics",
          message: error.message,
        });
      }
    }
  );

  app.get(
    "/api/student/upcoming-classes",
    isAuthenticated,
    isStudent,
    async (req, res) => {
      try {
        // Mock upcoming classes data
        const today = new Date();
        const dayNames = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];
        const currentDay = today.getDay();

        const upcomingClasses = [
          {
            id: 1,
            courseName: "Guitar Lessons",
            teacherName: "John Smith",
            date: `${dayNames[(currentDay + 1) % 7]}, ${new Date(
              today.getTime() + 86400000
            ).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
            time: "4:00 PM - 5:30 PM",
            room: "Studio A",
          },
          {
            id: 1,
            courseName: "Guitar Lessons",
            teacherName: "John Smith",
            date: `${dayNames[(currentDay + 3) % 7]}, ${new Date(
              today.getTime() + 86400000 * 3
            ).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
            time: "4:00 PM - 5:30 PM",
            room: "Studio A",
          },
          {
            id: 2,
            courseName: "Music Theory",
            teacherName: "Sarah Wilson",
            date: `${dayNames[(currentDay + 2) % 7]}, ${new Date(
              today.getTime() + 86400000 * 2
            ).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
            time: "5:00 PM - 6:00 PM",
            room: "Room 101",
          },
          {
            id: 2,
            courseName: "Music Theory",
            teacherName: "Sarah Wilson",
            date: `${dayNames[(currentDay + 5) % 7]}, ${new Date(
              today.getTime() + 86400000 * 5
            ).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
            time: "5:00 PM - 6:00 PM",
            room: "Room 101",
          },
        ];

        // Sort by date/time
        upcomingClasses.sort((a, b) => {
          const dateA = new Date(
            a.date.split(", ")[1] + " " + a.time.split(" - ")[0]
          );
          const dateB = new Date(
            b.date.split(", ")[1] + " " + b.time.split(" - ")[0]
          );
          return dateA.getTime() - dateB.getTime();
        });

        res.json(upcomingClasses);
      } catch (error: any) {
        console.error("Error fetching upcoming classes:", error);
        res.status(500).json({
          error: "Failed to fetch upcoming classes",
          message: error.message,
        });
      }
    }
  );

  app.get(
    "/api/student/payments",
    isAuthenticated,
    isStudent,
    async (req, res) => {
      try {
        // Mock payments data for student view
        const today = new Date();
        const nextMonth = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          15
        );
        const lastMonth = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          15
        );

        const payments = [
          {
            id: 101,
            invoiceId: "INV-2023-101",
            courseName: "Guitar Lessons",
            amount: 450.0,
            dueDate: nextMonth.toISOString().split("T")[0],
            status: "Pending",
          },
          {
            id: 100,
            invoiceId: "INV-2023-100",
            courseName: "Guitar Lessons",
            amount: 450.0,
            dueDate: today.toISOString().split("T")[0],
            status: "Paid",
          },
          {
            id: 99,
            invoiceId: "INV-2023-099",
            courseName: "Music Theory",
            amount: 350.0,
            dueDate: lastMonth.toISOString().split("T")[0],
            status: "Paid",
          },
        ];

        res.json(payments);
      } catch (error: any) {
        console.error("Error fetching payments:", error);
        res
          .status(500)
          .json({ error: "Failed to fetch payments", message: error.message });
      }
    }
  );

  // Get batch-wise attendance report
  app.get('/api/admin/attendance/batch-report', isAuthenticated, async (req, res) => {
    try {
      const batchId = req.query.batchId as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      if (!batchId || !startDate || !endDate) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Parse dates
      const parsedStartDate = new Date(startDate);
      const parsedEndDate = new Date(endDate);

      // Validate dates
      if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }

      const attendanceRecords = await storage.getBatchAttendance(
        parseInt(batchId),
        parsedStartDate,
        parsedEndDate
      );

      // Get students for this batch
      const enrollments = await storage.getEnrollments();
      const batchEnrollments = enrollments.filter(e => e.batchId === parseInt(batchId));
      const batchStudents = await storage.getStudents();
      const studentsInBatch = batchStudents.filter(s =>
        batchEnrollments.some(e => e.studentId === s.id)
      );

      // Process attendance records by student
      const processedAttendance = studentsInBatch.map(student => {
        // Convert attendanceRecords to an array if it's not already
        const records = Array.isArray(attendanceRecords) ? attendanceRecords : [attendanceRecords];

        const studentRecords = records.filter(record => record.studentId === student.id);
        const present = studentRecords.filter(r => r.status === 'present').length;
        const absent = studentRecords.filter(r => r.status === 'absent').length;
        const leave = studentRecords.filter(r => r.status === 'leave').length;

        return {
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          present,
          absent,
          leave
        };
      });

      return res.json(processedAttendance);
    } catch (error: any) {
      console.error('Error fetching batch attendance:', error);
      res.status(500).json({
        error: 'Failed to fetch batch attendance',
        message: error.message
      });
    }
  });



  app.get(
    "/api/student/attendance",
    isAuthenticated,
    isStudent,
    async (req, res) => {
      try {
        // Mock attendance records data
        const today = new Date();
        const oneDay = 24 * 60 * 60 * 1000; // milliseconds in one day

        const attendanceRecords = [
          {
            id: 301,
            date: new Date(today.getTime() - oneDay * 1)
              .toISOString()
              .split("T")[0],
            courseName: "Guitar Lessons",
            teacherName: "Sini",
            status: "present",
            remarks: "",
          },
          {
            id: 300,
            date: new Date(today.getTime() - oneDay * 3)
              .toISOString()
              .split("T")[0],
            courseName: "Gymnastics",
            teacherName: "Jenet",
            status: "present",
            remarks: "",
          },
          {
            id: 299,
            date: new Date(today.getTime() - oneDay * 6)
              .toISOString()
              .split("T")[0],
            courseName: "Zumba",
            teacherName: "Sini",
            status: "Late",
            remarks: "Arrived 10 minutes late",
          },
          {
            id: 298,
            date: new Date(today.getTime() - oneDay * 8)
              .toISOString()
              .split("T")[0],
            courseName: "Gymnastics",
            teacherName: "Jenet",
            status: "present",
            remarks: "",
          },
          {
            id: 297,
            date: new Date(today.getTime() - oneDay * 10)
              .toISOString()
              .split("T")[0],
            courseName: "Guitar Lessons",
            teacherName: "Sini",
            status: "present",
            remarks: "",
          },
          {
            id: 296,
            date: new Date(today.getTime() - oneDay * 12)
              .toISOString()
              .split("T")[0],
            courseName: "Zumba",
            teacherName: "Jenet",
            status: "absent",
            remarks: "Sick",
          },
          {
            id: 295,
            date: new Date(today.getTime() - oneDay * 14)
              .toISOString()
              .split("T")[0],
            courseName: "Gymnastics",
            teacherName: "Jenet",
            status: "present",
            remarks: "",
          },
          {
            id: 294,
            date: new Date(today.getTime() - oneDay * 16)
              .toISOString()
              .split("T")[0],
            courseName: "Guitar Lessons",
            teacherName: "Sini",
            status: "present",
            remarks: "",
          },
        ];

        // Sort attendance records by date (newest first)
        attendanceRecords.sort((a, b) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

        res.json(attendanceRecords);
      } catch (error: any) {
        console.error("Error fetching attendance records:", error);
        res.status(500).json({
          error: "Failed to fetch attendance records",
          message: error.message,
        });
      }
    }
  );

  // Get student attendance records
  app.get("/api/student/attendance", isAuthenticated, async (req, res) => {
    try {
      const courseId = req.query.course as string;
      const date = req.query.date as string;

      // Get all enrollments for the student
      const enrollments = await storage.getEnrollments();
      const studentEnrollments = enrollments.filter(
        (e) => e.studentId === req.user!.id
      );

      // Get all batches
      const batches = await storage.getBatches();

      // Get all attendance records
      let attendance = await storage.getAttendance();

      // Filter attendance records for the student's enrollments
      attendance = attendance?.filter((a: any) =>
        studentEnrollments.some((e) => e.id === a.enrollmentId)
      );

      // Filter by course if specified
      if (courseId && courseId !== "all") {
        const courseEnrollments = studentEnrollments.filter((e) => {
          const batch = batches.find((b) => b.id === e.batchId);
          return batch?.courseId.toString() === courseId;
        });
        attendance = attendance?.filter((a: any) =>
          courseEnrollments.some((e) => e.id === a.enrollmentId)
        );
      }

      // Filter by month if specified
      if (date) {
        const [year, month] = date.split("-");
        attendance = attendance?.filter((a: any) => {
          const attendanceDate = new Date(a.date);
          return (
            attendanceDate.getFullYear() === parseInt(year) &&
            attendanceDate.getMonth() === parseInt(month) - 1
          );
        });
      }

      // Enrich attendance data with course and teacher info
      const enrichedAttendance = await Promise.all(
        attendance?.map(async (record: any) => {
          const enrollment = studentEnrollments.find(
            (e) => e.id === record.enrollmentId
          );
          const batch = enrollment
            ? batches.find((b) => b.id === enrollment.batchId)
            : null;
          const course = batch ? await storage.getCourse(batch.courseId) : null;
          const teacher = batch ? await storage.getUser(batch.teacherId) : null;

          return {
            ...record,
            courseName: course?.name || "Unknown Course",
            teacherName: teacher?.fullName || "Unknown Teacher",
            batchName: batch?.name || "Unknown Batch",
          };
        })
      );

      res.json(enrichedAttendance);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Teacher-specific attendance routes
  app.get(
    "/api/teacher/batches",
    isAuthenticated,
    isTeacher,
    async (req, res) => {
      try {
        const teacherId = req.user!.id;
        const teacher = await storage.getEmployeeByEmployeeId(
          "EMP00" + teacherId
        );

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
            // time: `${batch.startTime} - ${batch.endTime}`
          });
        }

        res.json(batchesWithCourseInfo);
      } catch (error: any) {
        console.error("Error fetching teacher batches:", error);
        res
          .status(500)
          .json({ error: "Failed to fetch batches", message: error.message });
      }
    }
  );

  // Get students in a specific batch
  app.get(
    "/api/teacher/batch/students/:batchId",
    isAuthenticated,
    isTeacher,
    async (req, res) => {
      try {
        const teacherId = req.user!.id;
        const teacher = await storage.getEmployeeByEmployeeId(
          "EMP00" + teacherId
        );

        if (!teacher) {
          return res.status(404).json({ message: "Teacher record not found" });
        }

        const batchId = parseInt(req.params.batchId);

        // Verify this teacher teaches this batch
        const batch = await storage.getBatch(batchId);
        if (!batch || batch.teacherId !== teacher.id) {
          return res.status(403).json({
            message: "You do not have permission to access this batch",
          });
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
              enrollmentId: enrollment.id,
            });
          }
        }

        res.json(students);
      } catch (error: any) {
        console.error("Error fetching batch students:", error);
        res
          .status(500)
          .json({ error: "Failed to fetch students", message: error.message });
      }
    }
  );

  // Get attendance for a specific batch on a specific date
  app.get(
    "/api/teacher/attendance",
    isAuthenticated,
    isTeacher,
    async (req, res) => {
      try {
        const teacherId = req.user!.id;
        const teacher = await storage.getEmployeeByEmployeeId(
          "EMP00" + teacherId
        );

        if (!teacher) {
          return res.status(404).json({ message: "Teacher record not found" });
        }

        const { batchId, date } = req.query;

        if (!batchId || batchId === "all") {
          return res.json([]);
        }

        // Verify this teacher teaches this batch
        const batch = await storage.getBatch(parseInt(batchId as string));
        if (!batch || batch.teacherId !== teacher.id) {
          return res.status(403).json({
            message: "You do not have permission to access this batch",
          });
        }

        // Parse date
        const selectedDate = date ? new Date(date as string) : new Date();

        // Get enrollments for this batch
        const enrollments = await storage.getEnrollmentsByBatch(
          parseInt(batchId as string)
        );

        // Get attendance records for the specified date
        const allAttendanceRecords = await storage.getAttendanceByDate(
          selectedDate
        );

        // Filter attendance records for this batch's enrollments
        const attendanceRecords = [];

        for (const enrollment of enrollments) {
          const records = allAttendanceRecords.filter(
            (a: any) => a.enrollmentId === enrollment.id
          );

          for (const record of records) {
            const student = await storage.getStudent(enrollment.studentId);
            if (student) {
              // Use the student's id if userId doesn't exist
              const user = await storage.getUser(student.id);
              attendanceRecords.push({
                id: record.id,
                // enrollmentId: record.enrollmentId,
                studentId: student.id,
                studentName: user ? user.fullName : "Unknown Student",
                date: record.date,
                status: record.status,
                // remarks: record.remarks,
              });
            }
          }
        }

        res.json(attendanceRecords);
      } catch (error: any) {
        console.error("Error fetching attendance records:", error);
        res.status(500).json({
          error: "Failed to fetch attendance records",
          message: error.message,
        });
      }
    }
  );

  // Admin payments/invoices routes
  app.get("/api/payments", isAuthenticated, async (req, res) => {
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
          studentName,
        });
      }

      res.json(formattedPayments);
    } catch (error: any) {
      console.error("Error fetching payments:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch payments", message: error.message });
    }
  });

  app.post("/api/payments", isAuthenticated, async (req, res) => {
    try {
      const payment = await storage.createPayment(req.body);
      res.status(201).json(payment);
    } catch (error: any) {
      console.error("Error creating payment:", error);
      res
        .status(500)
        .json({ error: "Failed to create payment", message: error.message });
    }
  });

  app.put("/api/payments/:id", isAuthenticated, async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const updatedPayment = await storage.updatePayment(paymentId, req.body);

      if (!updatedPayment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      res.json(updatedPayment);
    } catch (error: any) {
      console.error("Error updating payment:", error);
      res
        .status(500)
        .json({ error: "Failed to update payment", message: error.message });
    }
  });

  // Student Payment routes
  app.get("/api/studentPayments", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const payments = await storage.getStudentPayments();
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/studentPayments", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const requestData = req.body;

      if (Array.isArray(requestData.invoiceNumber)) {
        return res.status(400).json({
          message: "This endpoint only accepts a single invoiceNumber string, not an array. The client should loop and make multiple requests."
        });
      }
      const paymentId = await storage.generatePaymentId();
      const paymentData = {
        ...req.body,
        paymentId,
      };
      const payment = await storage.createStudentPayment(paymentData);
      res.status(201).json(payment);
    } catch (error: any) {
      console.error("Error creating student payment:", error);
      res
        .status(500)
        .json({ error: "Failed to create student payment", message: error.message });
    }
  });

  app.get("/api/generate-payment-id", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const paymentId = await storage.generatePaymentId();
      res.json({ paymentId });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to generate payment ID", error: error.message });
    }
  });

  app.put("/api/studentPayments/:id", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const updatedPayment = await storage.updateStudentPayment(paymentId, req.body);

      if (!updatedPayment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      res.json(updatedPayment);
    } catch (error: any) {
      console.error("Error updating student payment:", error);
      res
        .status(500)
        .json({ error: "Failed to update student payment", message: error.message });
    }
  });

  app.delete("/api/studentPayments/:id", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const paymentId = parseInt(req.params.id);
      const deletedPayment = await storage.deleteStudentPayment(paymentId);

      if (!deletedPayment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      res.json(deletedPayment);
    } catch (error: any) {
      console.error("Error deleting student payment:", error);
      res
        .status(500)
        .json({ error: "Failed to delete student payment", message: error.message });
    }
  });

  app.get("/api/unpaidInvoices", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const unpaidInvoices = await storage.getUnpaidInvoices();
      res.json(unpaidInvoices);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/unpaidInvoicesByStudent/:studentId", isAuthenticated, async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const unpaidInvoices = await storage.getUnpaidInvoicesByStudent(studentId);
      res.json(unpaidInvoices);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/outstandingSummary/:studentId", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const outstandingSummary = await storage.getOutstandingSummary(studentId);
      res.json(outstandingSummary);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Credit Notes Routes

  app.get("/api/creditNotes", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const creditNotes = await storage.getCreditNotes();
      res.json(creditNotes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/creditNotes/:id", isAuthenticated, async (req, res) => {
    try {
      const creditNote = await storage.getCreditNoteByCreditNoteNumber(req.params.id);
      if (!creditNote) {
        return res.status(404).json({ message: "Credit note not found" });
      }
      res.json(creditNote);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/creditNotes/parent/:parentId', isAuthenticated, async (req, res) => {
    const parentId = parseInt(req.params.parentId, 10);

    if (isNaN(parentId)) {
      return res.status(400).json({ error: 'Invalid parent ID' });
    }

    const statusParam = req.query.status;
    let statuses: string[] | undefined;
    if (typeof statusParam === "string") {
      statuses = statusParam.split(",");
    }

    try {
      const creditNotes = await storage.getCreditNotesByParentId(parentId, statuses);
      res.status(200).json(creditNotes);
    } catch (error) {
      console.error('Error fetching credit notes:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post("/api/creditNotes", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const creditNote = await storage.createCreditNote(req.body);
      res.status(201).json(creditNote);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/paymentItems", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const paymentItem = await storage.createPaymentItem(req.body);
      res.status(201).json(paymentItem);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // User management routes
  app.get("/api/users", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/users/:id", isAdminOrBranchAdmin, async (req, res) => {
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

  app.post("/api/users", isAdminOrBranchAdmin, async (req, res) => {
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

  app.put("/api/users/:id", isAdminOrBranchAdmin, async (req, res) => {
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

  app.delete("/api/users/:id", isAdminOrBranchAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      // Prevent deleting own account
      if (req.user && req.user.id === userId) {
        return res
          .status(400)
          .json({ message: "Cannot delete your own account" });
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

  app.post(
    "/api/reset-password/:id",
    isAdminOrBranchAdmin,
    async (req, res) => {
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
        const updated = await storage.updateUserPassword(
          user.username,
          hashedPassword
        );

        if (!updated) {
          return res.status(500).json({ message: "Failed to update password" });
        }

        res.json({ message: "Password reset successfully" });
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  // Allow users to change their own password
  app.post("/api/change-password", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res
          .status(400)
          .json({ message: "Current password and new password are required" });
      }

      // Verify current password
      if (!(await comparePasswords(currentPassword, user.password))) {
        return res
          .status(401)
          .json({ message: "Current password is incorrect" });
      }

      // Update to new password
      const hashedPassword = await hashPassword(newPassword);
      const updated = await storage.updateUserPassword(
        user.username,
        hashedPassword
      );

      if (!updated) {
        return res.status(500).json({ message: "Failed to update password" });
      }

      res.json({ message: "Password changed successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Add this to your backend routes file if it's not already there
  app.get("/api/roles/:roleName", async (req, res) => {
    try {
      const { roleName } = req.params;
      const roleData = await db.select().from(roles).where(eq(roles.name, roleName)).limit(1);

      if (roleData.length === 0) {
        return res.status(404).json({ message: "Role not found" });
      }
      res.json(roleData[0]); // Send back the role data
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/roles", async (req, res) => {
    try {
      const { name, description, permissions } = req.body;

      // Basic validation
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: "Role 'name' is required and must be a non-empty string." });
      }

      // Check if role with this name already exists
      const existing = await db.select().from(roles).where(eq(roles.name, name));
      if (existing.length > 0) {
        return res.status(409).json({ message: "A role with this name already exists." });
      }

      await db.insert(roles).values({
        id: name,
        name: name,
        permissions: permissions || {}
      });

      res.status(201).json({ success: true, message: `Role '${name}' created successfully.` });

    } catch (error) {
      console.error("Error creating role:", error);
      res.status(500).json({ message: "Failed to create role." });
    }
  });

  // PUT /api/roles/:roleName/permissions
  app.put("/api/roles/:roleName/permissions", async (req, res) => {
    const { roleName } = req.params;
    const { permissions } = req.body;

    await db.update(roles)
      .set({ permissions })
      .where(eq(roles.name, roleName));

    res.json({ success: true });
  });



  // PDF and Excel generation routes

  // Enhanced PDF generation matching the Jazzrockers design
function generateTable(doc: PDFKit.PDFDocument, table: { headers: string[], rows: any[][] }, config: any) {
  const tableTop = doc.y;
  const { headers, rows } = table;
  const columnCount = headers.length;
  const rowHeight = 30;
  const headerHeight = 35;
  const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const columnWidth = tableWidth / columnCount;

  // Track current position
  let currentY = tableTop;

  // Draw table header
  drawTableHeader(doc, headers, currentY, tableWidth, headerHeight, columnWidth);
  currentY += headerHeight;

  // Process each row
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    
    // Check if we need a new page (leave space for footer)
    if (currentY + rowHeight > doc.page.height - 150) {
      doc.addPage();
      currentY = doc.page.margins.top; // Reset to top margin of new page
      
      // Redraw table header on new page
      drawTableHeader(doc, headers, currentY, tableWidth, headerHeight, columnWidth);
      currentY += headerHeight;
    }

    const y = currentY;
    const isEvenRow = i % 2 === 0;

    // Alternating row colors
    if (isEvenRow) {
      doc.rect(doc.page.margins.left, y, tableWidth, rowHeight).fill('#FFFFFF');
    } else {
      doc.rect(doc.page.margins.left, y, tableWidth, rowHeight).fill('#F5F5F5');
    }

    // Add subtle row borders
    doc.strokeColor('#E0E0E0')
      .lineWidth(0.3)
      .moveTo(doc.page.margins.left, y + rowHeight)
      .lineTo(doc.page.margins.left + tableWidth, y + rowHeight)
      .stroke();

    // Draw cell data
    row.forEach((cell, j) => {
      const x = doc.page.margins.left + (j * columnWidth);

      // Add subtle vertical separators
      if (j > 0) {
        doc.strokeColor('#F0F0F0')
          .lineWidth(0.3)
          .moveTo(x, y)
          .lineTo(x, y + rowHeight)
          .stroke();
      }

      // Format cell content with appropriate colors
      let cellText = String(cell);
      let textColor = '#333333';
      let alignment = 'center';

      // Color coding based on content
      if (cellText.toLowerCase().includes('unpaid')) {
        textColor = '#F44336'; // Red for unpaid
      } else if (cellText.toLowerCase().includes('paid') && !cellText.toLowerCase().includes('unpaid')) {
        textColor = '#4CAF50'; // Green for paid
      } else if (cellText.toLowerCase().includes('partially_paid')) {
        textColor = '#FF9800'; // Orange for partially paid
      }

      // Align numbers to center, text to center
      if (!isNaN(Number(cell)) || cellText.includes('-') || cellText.includes('/')) {
        alignment = 'center';
      }

      doc.fillColor(textColor)
        .font('Helvetica')
        .text(cellText, x + 5, y + 8, {
          width: columnWidth - 10,
          align: alignment,
          ellipsis: true
        });
    });

    currentY += rowHeight;
  }

  // Calculate sums for numeric columns
  const { numericColumns, sums } = calculateSums(rows, headers);
  
  // Add summary row if there are sums
  if (numericColumns.length > 0) {
    // Check if we need a new page for the summary
    if (currentY + rowHeight > doc.page.height - 150) {
      doc.addPage();
      currentY = doc.page.margins.top;
      
      // Redraw table header on new page for consistency
      drawTableHeader(doc, headers, currentY, tableWidth, headerHeight, columnWidth);
      currentY += headerHeight;
    }
    
    // Add summary row with different styling
    const summaryY = currentY;
    doc.rect(doc.page.margins.left, summaryY, tableWidth, rowHeight)
      .fill([224, 224, 224]); // Light gray background
    
    doc.strokeColor('#BDBDBD')
      .lineWidth(0.5)
      .rect(doc.page.margins.left, summaryY, tableWidth, rowHeight)
      .stroke();
    
    // Add "TOTAL" label in first column
    doc.fillColor('#000000')
      .font('Helvetica-Bold')
      .text('TOTAL', doc.page.margins.left + 5, summaryY + 8, {
        width: columnWidth - 10,
        align: 'left'
      });
    
    // Add sums to numeric columns
    headers.forEach((_, i) => {
      const x = doc.page.margins.left + (i * columnWidth);
      
      if (numericColumns.includes(i)) {
        doc.fillColor('#000000')
          .font('Helvetica-Bold')
          .text(sums[i].toFixed(2), x + 5, summaryY + 8, {
            width: columnWidth - 10,
            align: 'center'
          });
      }
    });
    
    currentY += rowHeight;
  }

  // Removed the purple border - this section has been commented out
  // doc.strokeColor('#3F51B5')
  //   .lineWidth(1)
  //   .rect(doc.page.margins.left, tableTop, tableWidth, currentY - tableTop)
  //   .stroke();

  // Move the doc's y position below the table
  doc.y = currentY + 30;
}
// Helper function to draw table header
function drawTableHeader(doc: PDFKit.PDFDocument, headers: string[], y: number, tableWidth: number, headerHeight: number, columnWidth: number) {
  doc.font('Helvetica-Bold')
    .fontSize(10)
    .fillColor('#FFFFFF');

  // Draw header background
  doc.rect(doc.page.margins.left, y, tableWidth, headerHeight)
    .fill([63, 81, 181]);

  // Draw header text
  headers.forEach((header, i) => {
    const x = doc.page.margins.left + (i * columnWidth);

    // Add vertical separators in header
    if (i > 0) {
      doc.strokeColor('#FFFFFF')
        .lineWidth(0.5)
        .moveTo(x, y + 5)
        .lineTo(x, y + headerHeight - 5)
        .stroke();
    }

    doc.fillColor('#FFFFFF')
      .text(header, x + 8, y + 12, {
        width: columnWidth - 16,
        align: 'center',
        ellipsis: true
      });
  });
}
// Add the calculateSums function
function calculateSums(rows: any[][], columns: string[]) {
  const sums: { [key: string]: number } = {};
  
  // Identify numeric columns (those that contain numbers)
  const numericColumns: number[] = [];
  
  columns.forEach((col, index) => {
    // Skip SL No column (first column) and any other non-numeric columns
    if (col === "#" || col === "SL No" || col.toLowerCase().includes("no")) {
      return; // Skip this column
    }
    
    // Check if this column contains numeric data
    const hasNumbers = rows.some(row => {
      const value = row[index];
      return !isNaN(parseFloat(String(value))) && isFinite(Number(value));
    });
    
    if (hasNumbers) {
      numericColumns.push(index);
    }
  });
  
  // Calculate sums for numeric columns
  numericColumns.forEach(colIndex => {
    sums[colIndex] = rows.reduce((total, row) => {
      const value = parseFloat(String(row[colIndex])) || 0;
      return total + value;
    }, 0);
  });
  
  return { numericColumns, sums };
}


  // Function to add the header exactly like the Jazzrockers design
function addJazzrockersHeader(doc: PDFKit.PDFDocument, config: any) {
  const pageWidth = doc.page.width;
  
  // Save current state
  doc.save();

  const logoPath = path.join(process.cwd(), 'server', 'assets', 'header.png');

  // Start header at the very top of the page (or close to it)
  const headerStartY = 0; // Adjust this value - smaller = closer to top
  
  // Place header image if it exists
  if (fs.existsSync(logoPath)) {
    try {
      // Draw header image at the top of the page
      doc.image(logoPath, 0, headerStartY, {
        width: pageWidth,
        // Let PDFKit maintain aspect ratio
      });
      
      // Move Y position down by the image height (estimate if needed)
      // You might need to adjust this based on your actual header image dimensions
      const estimatedHeaderHeight = 100; // Adjust this value based on your header.png
      doc.y = headerStartY + estimatedHeaderHeight;
      
    } catch (error) {
      console.error("Could not load header.png, falling back to text logo.", error);
      // Fallback code...
      doc.fontSize(24).font('Helvetica-Bold').fillColor([63, 81, 181]).text('jazzrockers', 50, headerStartY);
      doc.y = headerStartY + 30;
      doc.fontSize(12).font('Helvetica').fillColor('#666666').text('DANCE | MUSIC | FINEARTS | FITNESS', 50, doc.y);
      doc.y += 20;
    }
  } else {
    console.warn(`File not found at the specified path: ${logoPath}. Displaying fallback text logo.`);
    // Fallback code...
    doc.fontSize(24).font('Helvetica-Bold').fillColor([63, 81, 181]).text('jazzrockers', 50, headerStartY);
    doc.y = headerStartY + 30;
    doc.fontSize(12).font('Helvetica').fillColor('#666666').text('DANCE | MUSIC | FINEARTS | FITNESS', 50, doc.y);
    doc.y += 20;
  }

 doc.y += 20; // Add more space between header and title
  
  doc.fontSize(20)
    .font('Helvetica-Bold')
    .fillColor('#333333')
    .text(config.title, 0, doc.y, {
      align: 'center'
    });
  
  // Move Y position down after title
  doc.y += 30;

  doc.restore(); // Restore state
}
  // Function to add report details (period and generation info)
  function addReportDetails(doc: PDFKit.PDFDocument, config: any) {
    const startY = doc.y;

    doc.fontSize(11)
      .font('Helvetica')
      .fillColor('#333333');

    // Period information
    if (config.periodText) {
      doc.text(`Period: ${config.periodText}`, 50, startY);
    }

    // Generation timestamp
    const generatedText = `Generated on: ${format(new Date(), "MMMM dd, yyyy 'at' h:mm a")}`;
    doc.text(generatedText, 50, startY + 15);

    // Additional spacing before table
    doc.y = startY + 50;
  }



// Function to add the footer to the bottom of a page
function addJazzrockersFooter(doc: PDFKit.PDFDocument) {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const footerPath = path.join(process.cwd(), 'server', 'assets', 'footer.png');

  // Check if the footer image exists before trying to draw it
  if (fs.existsSync(footerPath)) {
    try {
      // You may need to adjust the '60' based on the actual height of your footer.png
      // This positions the image 60 units up from the absolute bottom of the page.
      const footerHeight = 110; 

      doc.image(footerPath, 0, pageHeight - footerHeight, {
        width: pageWidth,
        height: footerHeight, // Fix the height to avoid stretching
      });
    } catch (error) {
      console.error("Could not load or draw footer.png.", error);
    }
  } else {
    // This will only log a warning once if the file is missing
    // console.warn(`Footer image not found at path: ${footerPath}`);
  }
}


 app.post("/api/export/pdf", isAuthenticated, async (req, res) => {
  try {
    const { password, reportData, config } = req.body;

    if (!password || !reportData || !config) {
      return res.status(400).send("Missing required data for export.");
    }

    const doc = new PDFDocument({
      size: 'a4',
      layout: config.orientation === 'p' ? 'portrait' : 'landscape',
      userPassword: password,
      margins: { top: 50, bottom: 100, left: 50, right: 50 }, // Increased bottom margin for footer
      info: {
        Title: config.title,
        Author: 'Jazzrockers',
        Subject: config.title,
        Creator: 'Jazzrockers Report System',
        CreationDate: new Date()
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${config.fileName}.pdf"`);

    doc.pipe(res);

    // Add header first
    addJazzrockersHeader(doc, config);

    // Add report details
    addReportDetails(doc, config);

    // Add the styled table
    generateTable(doc, {
      headers: config.columns,
      rows: reportData
    }, config);

    // Add footer to the first page
    addJazzrockersFooter(doc);

    // Handle footer for subsequent pages
    let pageCount = doc.bufferedPageRange().count;
    for (let i = 1; i < pageCount; i++) {
      doc.switchToPage(i);
      addJazzrockersFooter(doc);
    }

    doc.end();

  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).send("Failed to generate PDF.");
  }
});

  app.post("/api/export/excel", isAuthenticated, async (req, res) => {
    try {
      const { password, reportData, config } = req.body;

      if (!password || !reportData || !config) {
        return res.status(400).send("Missing required data for export.");
      }

      const workbook = new ExcelJS.Workbook();

      // Set workbook properties
      workbook.creator = 'Jazzrockers';
      workbook.lastModifiedBy = 'Jazzrockers Report System';
      workbook.created = new Date();
      workbook.modified = new Date();

      const worksheet = workbook.addWorksheet(config.sheetName, {
        pageSetup: {
          paperSize: 9, // A4
          orientation: config.orientation === 'p' ? 'portrait' : 'landscape',
          fitToPage: true,
          margins: {
            left: 0.7, right: 0.7,
            top: 0.75, bottom: 0.75,
            header: 0.3, footer: 0.3
          }
        }
      });

      // Add title row with Jazzrockers styling
      worksheet.mergeCells('A1:' + String.fromCharCode(64 + config.excelColumns.length) + '1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = config.title;
      titleCell.font = { bold: true, size: 18, color: { argb: '333333' } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFF' }
      };

      // Add period info if available
      if (config.periodText) {
        worksheet.mergeCells('A2:' + String.fromCharCode(64 + config.excelColumns.length) + '2');
        const periodCell = worksheet.getCell('A2');
        periodCell.value = `Period: ${config.periodText}`;
        periodCell.font = { size: 11, color: { argb: '333333' } };
        periodCell.alignment = { vertical: 'middle', horizontal: 'left' };
      }

      // Add generation info
      const genRow = config.periodText ? 3 : 2;
      worksheet.mergeCells(`A${genRow}:` + String.fromCharCode(64 + config.excelColumns.length) + genRow);
      const genCell = worksheet.getCell(`A${genRow}`);
      genCell.value = `Generated on: ${format(new Date(), "MMMM dd, yyyy 'at' h:mm a")}`;
      genCell.font = { size: 11, color: { argb: '333333' } };
      genCell.alignment = { vertical: 'middle', horizontal: 'left' };

      // Set up columns starting from the appropriate row
      const headerRowNum = config.periodText ? 5 : 4;
      worksheet.columns = config.excelColumns.map((colName: string) => ({
        header: colName,
        key: colName,
        width: Math.max(colName.length + 2, 12)
      }));

      // Style the header row with Jazzrockers blue
      const headerRow = worksheet.getRow(headerRowNum);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '3F51B5' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // Add data with alternating colors
      reportData.forEach((rowData: any, index: number) => {
        const row = worksheet.addRow(rowData);

        // Alternate row colors
        if (index % 2 === 1) {
          row.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'F5F5F5' }
            };
          });
        }

        // Add borders and center alignment
        row.eachCell((cell) => {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.border = {
            top: { style: 'thin', color: { argb: 'E0E0E0' } },
            left: { style: 'thin', color: { argb: 'E0E0E0' } },
            bottom: { style: 'thin', color: { argb: 'E0E0E0' } },
            right: { style: 'thin', color: { argb: 'E0E0E0' } }
          };

          // Color coding for status
          const cellValue = String(cell.value || '').toLowerCase();
          if (cellValue.includes('unpaid')) {
            cell.font = { color: { argb: 'F44336' } };
          } else if (cellValue.includes('paid') && !cellValue.includes('unpaid')) {
            cell.font = { color: { argb: '4CAF50' } };
          } else if (cellValue.includes('partially_paid')) {
            cell.font = { color: { argb: 'FF9800' } };
          }
        });
      });

      // Protect the worksheet
      await worksheet.protect(password, {
        selectLockedCells: true,
        selectUnlockedCells: false,
      });

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${config.fileName}.xlsx"`);

      await workbook.xlsx.write(res);
      res.end();

    } catch (error) {
      console.error("Error generating Excel:", error);
      res.status(500).send("Failed to generate Excel.");
    }
  });


  const httpServer = createServer(app);

  return httpServer;
}