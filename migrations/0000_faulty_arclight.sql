CREATE TABLE "attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"enrollment_id" integer NOT NULL,
	"date" date NOT NULL,
	"status" text NOT NULL,
	"compensation_batch_id" text,
	"compensation_date" date,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"course_id" integer NOT NULL,
	"teacher_id" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"days_of_week" text NOT NULL,
	"room_number" text,
	"capacity" integer NOT NULL,
	"category" text NOT NULL,
	"branch" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"manager" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "branches_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "compensation_classes" (
	"id" serial PRIMARY KEY NOT NULL,
	"enrollment_id" integer NOT NULL,
	"original_batch_id" text NOT NULL,
	"compensation_batch_id" text NOT NULL,
	"missed_date" date NOT NULL,
	"compensation_date" date NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "compensation_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"original_batch_id" integer NOT NULL,
	"compensation_batch_id" integer NOT NULL,
	"original_class_date" date NOT NULL,
	"requested_compensation_date" date NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"remarks" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"fee" numeric(10, 2) NOT NULL,
	"duration" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"full_name" text NOT NULL,
	"user_id" integer NOT NULL,
	"position" text NOT NULL,
	"joining_date" date NOT NULL,
	"email" text,
	"salary" numeric(10, 2) NOT NULL,
	"bank_account" text,
	"status" text DEFAULT 'active' NOT NULL,
	"branch" text NOT NULL,
	"specialization" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "employees_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	"batch_id" integer NOT NULL,
	"branch_id" integer NOT NULL,
	"enrollment_date" date DEFAULT now(),
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"enrollment_id" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" text NOT NULL,
	"documents" text,
	"refund_eligible" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" integer NOT NULL,
	"receiver_id" integer NOT NULL,
	"content" text NOT NULL,
	"sent_at" timestamp DEFAULT now(),
	"read_at" timestamp,
	"status" text DEFAULT 'sent' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"student_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_date" date NOT NULL,
	"due_date" date NOT NULL,
	"status" text NOT NULL,
	"payment_method" text,
	"remarks" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "payments_invoice_id_unique" UNIQUE("invoice_id")
);
--> statement-breakpoint
CREATE TABLE "payrolls" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"month" text NOT NULL,
	"basic_salary" numeric(10, 2) NOT NULL,
	"incentives" numeric(10, 2) DEFAULT '0',
	"deductions" numeric(10, 2) DEFAULT '0',
	"net_salary" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_date" date,
	"remarks" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "schedule" (
	"id" serial PRIMARY KEY NOT NULL,
	"day" text NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" text NOT NULL,
	"first_name" text NOT NULL,
	"middle_name" text,
	"last_name" text NOT NULL,
	"username" text NOT NULL,
	"password" text,
	"date_of_birth" date,
	"age" integer,
	"gender" text,
	"parent_id" integer NOT NULL,
	"user_id" integer,
	"street" text,
	"community" text,
	"residence_address" text,
	"flat_no" text,
	"phone" text,
	"whatsapp_no" text,
	"email" text,
	"enrollment_date" date,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "students_student_id_unique" UNIQUE("student_id"),
	CONSTRAINT "students_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "transportation" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"transportation_needed" boolean DEFAULT false,
	"mode" text,
	"fee" text,
	"picking_point" text,
	"dropping_point" text,
	"contact_person" text,
	"pick_up_time" time,
	"drop_off_time" time,
	"address" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"role" text DEFAULT 'parent' NOT NULL,
	"phone" text,
	"address" text,
	"branch" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_teacher_id_employees_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transportation" ADD CONSTRAINT "transportation_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;