CREATE TYPE "public"."gender" AS ENUM('woman', 'man', 'non-binary', 'prefer-not-to-say');--> statement-breakpoint
CREATE TYPE "public"."preferred_unit" AS ENUM('metric', 'imperial');--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"date_of_birth" date,
	"gender" "gender",
	"height_cm" real,
	"weight_kg" real,
	"preferred_unit" "preferred_unit" DEFAULT 'metric' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;