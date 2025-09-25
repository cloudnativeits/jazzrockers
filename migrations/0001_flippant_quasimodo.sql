ALTER TABLE "batches" ALTER COLUMN "capacity" SET DEFAULT 10;--> statement-breakpoint
ALTER TABLE "batches" ALTER COLUMN "capacity" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "batches" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "batches" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "batches" DROP COLUMN "start_time";--> statement-breakpoint
ALTER TABLE "batches" DROP COLUMN "end_time";