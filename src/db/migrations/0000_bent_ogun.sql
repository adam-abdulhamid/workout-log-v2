CREATE TABLE "block_note_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workout_log_id" uuid NOT NULL,
	"block_id" uuid NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "block_week_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"block_week_id" uuid NOT NULL,
	"order" integer NOT NULL,
	"name" text NOT NULL,
	"sets" integer,
	"reps" text,
	"tempo" text,
	"rest" text,
	"weight_guidance" text,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "block_weeks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"block_id" uuid NOT NULL,
	"week_number" integer NOT NULL,
	"notes" text,
	CONSTRAINT "unique_block_week" UNIQUE("block_id","week_number")
);
--> statement-breakpoint
CREATE TABLE "blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_modified" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blocks_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "day_template_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day_template_id" uuid NOT NULL,
	"block_id" uuid NOT NULL,
	"order" integer NOT NULL,
	CONSTRAINT "unique_day_block" UNIQUE("day_template_id","block_id")
);
--> statement-breakpoint
CREATE TABLE "day_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day_number" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"version" integer DEFAULT 1 NOT NULL,
	"last_modified" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "day_templates_day_number_unique" UNIQUE("day_number")
);
--> statement-breakpoint
CREATE TABLE "exercise_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workout_log_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"set_number" integer NOT NULL,
	"reps" integer,
	"weight" real,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "exercise_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exercise_log_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"name" text NOT NULL,
	"sets" integer,
	"reps" text,
	"tempo" text,
	"rest" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"description" text,
	"screenshot" text NOT NULL,
	"url" text NOT NULL,
	"user_agent" text,
	"screen_width" integer,
	"screen_height" integer,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "injury_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" text NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"image_url" text,
	"is_feedback_user" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
CREATE TABLE "weight_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"weight_lb" real NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workout_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"day_template_id" uuid,
	"completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "block_note_logs" ADD CONSTRAINT "block_note_logs_workout_log_id_workout_logs_id_fk" FOREIGN KEY ("workout_log_id") REFERENCES "public"."workout_logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block_note_logs" ADD CONSTRAINT "block_note_logs_block_id_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block_week_exercises" ADD CONSTRAINT "block_week_exercises_block_week_id_block_weeks_id_fk" FOREIGN KEY ("block_week_id") REFERENCES "public"."block_weeks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block_weeks" ADD CONSTRAINT "block_weeks_block_id_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "day_template_blocks" ADD CONSTRAINT "day_template_blocks_day_template_id_day_templates_id_fk" FOREIGN KEY ("day_template_id") REFERENCES "public"."day_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "day_template_blocks" ADD CONSTRAINT "day_template_blocks_block_id_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."blocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_logs" ADD CONSTRAINT "exercise_logs_workout_log_id_workout_logs_id_fk" FOREIGN KEY ("workout_log_id") REFERENCES "public"."workout_logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_logs" ADD CONSTRAINT "exercise_logs_exercise_id_block_week_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."block_week_exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_snapshots" ADD CONSTRAINT "exercise_snapshots_exercise_log_id_exercise_logs_id_fk" FOREIGN KEY ("exercise_log_id") REFERENCES "public"."exercise_logs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_entries" ADD CONSTRAINT "feedback_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "injury_entries" ADD CONSTRAINT "injury_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weight_entries" ADD CONSTRAINT "weight_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_logs" ADD CONSTRAINT "workout_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workout_logs" ADD CONSTRAINT "workout_logs_day_template_id_day_templates_id_fk" FOREIGN KEY ("day_template_id") REFERENCES "public"."day_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_block_note_logs_workout" ON "block_note_logs" USING btree ("workout_log_id");--> statement-breakpoint
CREATE INDEX "idx_block_week_exercises_week" ON "block_week_exercises" USING btree ("block_week_id");--> statement-breakpoint
CREATE INDEX "idx_block_weeks_block" ON "block_weeks" USING btree ("block_id");--> statement-breakpoint
CREATE INDEX "idx_day_template_blocks_block" ON "day_template_blocks" USING btree ("block_id");--> statement-breakpoint
CREATE INDEX "idx_day_template_blocks_template" ON "day_template_blocks" USING btree ("day_template_id");--> statement-breakpoint
CREATE INDEX "idx_exercise_logs_workout" ON "exercise_logs" USING btree ("workout_log_id");--> statement-breakpoint
CREATE INDEX "idx_exercise_logs_exercise" ON "exercise_logs" USING btree ("exercise_id");--> statement-breakpoint
CREATE INDEX "idx_exercise_snapshots_log" ON "exercise_snapshots" USING btree ("exercise_log_id");--> statement-breakpoint
CREATE INDEX "idx_workout_logs_user_date" ON "workout_logs" USING btree ("user_id","date");