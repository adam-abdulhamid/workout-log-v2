CREATE TABLE IF NOT EXISTS "stretch_time_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"stretch_id" text NOT NULL,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_stretch_time_user_date_stretch" UNIQUE("user_id","date","stretch_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stretch_time_entries" ADD CONSTRAINT "stretch_time_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_stretch_time_user_date" ON "stretch_time_entries" USING btree ("user_id","date");
