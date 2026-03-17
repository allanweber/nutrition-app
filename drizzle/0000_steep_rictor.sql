CREATE TYPE "public"."goal_type" AS ENUM('weight_loss', 'maintenance', 'weight_gain', 'muscle_gain', 'fat_loss', 'performance', 'general_health');--> statement-breakpoint
CREATE TYPE "public"."meal_type" AS ENUM('breakfast', 'lunch', 'dinner', 'snack', 'morning_snack', 'afternoon_snack', 'evening_snack', 'pre_workout', 'post_workout', 'other');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('individual', 'professional', 'admin');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" varchar(50) NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"id_token" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "body_checkins" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"goal_id" integer,
	"check_in_date" timestamp NOT NULL,
	"input_unit_system" varchar(10),
	"weight_kg" numeric(10, 2) NOT NULL,
	"raw_weight" jsonb,
	"photos" jsonb,
	"skinfolds_mm" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diet_plan_meal_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"diet_plan_id" integer NOT NULL,
	"meal_type" "meal_type" NOT NULL,
	"day_of_week" integer,
	"scheduled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diet_plan_meal_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"food_id" integer,
	"quantity" numeric(10, 2) NOT NULL,
	"serving_unit" varchar(100),
	"food_name" varchar(500) NOT NULL,
	"brand_name" varchar(500),
	"calories" numeric(10, 2),
	"protein" numeric(10, 2),
	"carbs" numeric(10, 2),
	"fat" numeric(10, 2),
	"fiber" numeric(10, 2),
	"sugar" numeric(10, 2),
	"sodium" numeric(10, 2),
	"serving_qty" numeric(10, 2),
	"serving_unit_snapshot" varchar(100),
	"serving_weight_grams" numeric(10, 2),
	"photo_thumb_snapshot" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diet_plan_meals" (
	"id" serial PRIMARY KEY NOT NULL,
	"diet_plan_id" integer NOT NULL,
	"food_id" integer NOT NULL,
	"meal_type" "meal_type" NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"serving_unit" varchar(100),
	"day_of_week" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diet_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"target_calories" numeric(10, 2),
	"target_protein" numeric(10, 2),
	"target_carbs" numeric(10, 2),
	"target_fat" numeric(10, 2),
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_verification_challenge" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"email" varchar(255) NOT NULL,
	"code_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"sent_count_hour" integer DEFAULT 0 NOT NULL,
	"sent_count_window_start" timestamp DEFAULT now() NOT NULL,
	"last_sent_at" timestamp DEFAULT now() NOT NULL,
	"failed_count_window" integer DEFAULT 0 NOT NULL,
	"failed_count_window_start" timestamp DEFAULT now() NOT NULL,
	"locked_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_verification_challenge_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "food_alt_measures" (
	"id" serial PRIMARY KEY NOT NULL,
	"food_id" integer NOT NULL,
	"serving_weight" numeric(10, 2) NOT NULL,
	"measure" varchar(100) NOT NULL,
	"seq" integer DEFAULT 1,
	"qty" numeric(10, 2) DEFAULT '1' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food_log_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"meal_id" integer NOT NULL,
	"food_id" integer,
	"quantity" numeric(10, 2) NOT NULL,
	"serving_unit" varchar(100),
	"food_name" varchar(500) NOT NULL,
	"brand_name" varchar(500),
	"calories" numeric(10, 2),
	"protein" numeric(10, 2),
	"carbs" numeric(10, 2),
	"fat" numeric(10, 2),
	"fiber" numeric(10, 2),
	"sugar" numeric(10, 2),
	"sodium" numeric(10, 2),
	"serving_qty" numeric(10, 2),
	"serving_unit_snapshot" varchar(100),
	"serving_weight_grams" numeric(10, 2),
	"photo_thumb_snapshot" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food_log_meals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"meal_type" "meal_type" NOT NULL,
	"consumed_at" timestamp NOT NULL,
	"source_diet_plan_meal_group_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"food_id" integer NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"serving_unit" varchar(100),
	"meal_type" "meal_type" NOT NULL,
	"consumed_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"food_id" integer NOT NULL,
	"thumb" varchar(500),
	"medium" varchar(500),
	"highres" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "food_photos_food_id_unique" UNIQUE("food_id")
);
--> statement-breakpoint
CREATE TABLE "foods" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" varchar(100),
	"source" varchar(100) DEFAULT 'user_custom' NOT NULL,
	"name" varchar(500) NOT NULL,
	"brand_name" varchar(500),
	"serving_qty" numeric(10, 2),
	"serving_unit" varchar(100),
	"serving_weight_grams" numeric(10, 2),
	"calories" numeric(10, 2),
	"protein" numeric(10, 2),
	"carbs" numeric(10, 2),
	"fat" numeric(10, 2),
	"fiber" numeric(10, 2),
	"sugar" numeric(10, 2),
	"sodium" numeric(10, 2),
	"food_type" varchar(50),
	"full_nutrients" jsonb,
	"is_raw" boolean DEFAULT false,
	"is_custom" boolean DEFAULT false,
	"user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nutrition_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"goal_type" "goal_type" NOT NULL,
	"age_years" integer,
	"sex" varchar(20),
	"height_cm" numeric(10, 2),
	"weight_kg" numeric(10, 2),
	"activity_multiplier" numeric(6, 3),
	"goal_rate_kg_per_week" numeric(6, 3),
	"macro_preset_id" varchar(50),
	"protein_g_per_kg" numeric(6, 2),
	"bmr_calories" numeric(10, 2),
	"tdee_calories" numeric(10, 2),
	"recommended_targets" jsonb,
	"was_manually_overridden" boolean DEFAULT false,
	"calorie_adjustment_strategy" varchar(30),
	"input_unit_system" varchar(10),
	"wizard_inputs" jsonb,
	"target_calories" numeric(10, 2),
	"target_protein" numeric(10, 2),
	"target_carbs" numeric(10, 2),
	"target_fat" numeric(10, 2),
	"target_fiber" numeric(10, 2),
	"target_sodium" numeric(10, 2),
	"activity_level" varchar(50),
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_event" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"email" varchar(255),
	"type" varchar(64) NOT NULL,
	"ip" varchar(64),
	"user_agent" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"image" varchar(500),
	"role" "user_role" DEFAULT 'individual' NOT NULL,
	"email_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" varchar(255) NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "body_checkins" ADD CONSTRAINT "body_checkins_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "body_checkins" ADD CONSTRAINT "body_checkins_goal_id_nutrition_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."nutrition_goals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diet_plan_meal_groups" ADD CONSTRAINT "diet_plan_meal_groups_diet_plan_id_diet_plans_id_fk" FOREIGN KEY ("diet_plan_id") REFERENCES "public"."diet_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diet_plan_meal_items" ADD CONSTRAINT "diet_plan_meal_items_group_id_diet_plan_meal_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."diet_plan_meal_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diet_plan_meal_items" ADD CONSTRAINT "diet_plan_meal_items_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diet_plan_meals" ADD CONSTRAINT "diet_plan_meals_diet_plan_id_diet_plans_id_fk" FOREIGN KEY ("diet_plan_id") REFERENCES "public"."diet_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diet_plan_meals" ADD CONSTRAINT "diet_plan_meals_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diet_plans" ADD CONSTRAINT "diet_plans_client_id_user_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_verification_challenge" ADD CONSTRAINT "email_verification_challenge_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_alt_measures" ADD CONSTRAINT "food_alt_measures_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_log_items" ADD CONSTRAINT "food_log_items_meal_id_food_log_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."food_log_meals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_log_items" ADD CONSTRAINT "food_log_items_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_log_meals" ADD CONSTRAINT "food_log_meals_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_log_meals" ADD CONSTRAINT "food_log_meals_source_diet_plan_meal_group_id_diet_plan_meal_groups_id_fk" FOREIGN KEY ("source_diet_plan_meal_group_id") REFERENCES "public"."diet_plan_meal_groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_logs" ADD CONSTRAINT "food_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_logs" ADD CONSTRAINT "food_logs_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_photos" ADD CONSTRAINT "food_photos_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foods" ADD CONSTRAINT "foods_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nutrition_goals" ADD CONSTRAINT "nutrition_goals_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_event" ADD CONSTRAINT "security_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "accounts_provider_id_idx" ON "account" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "body_checkins_user_id_idx" ON "body_checkins" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "body_checkins_user_check_in_date_idx" ON "body_checkins" USING btree ("user_id","check_in_date");--> statement-breakpoint
CREATE INDEX "body_checkins_goal_id_check_in_date_idx" ON "body_checkins" USING btree ("goal_id","check_in_date");--> statement-breakpoint
CREATE INDEX "diet_plan_meal_groups_diet_plan_id_idx" ON "diet_plan_meal_groups" USING btree ("diet_plan_id");--> statement-breakpoint
CREATE INDEX "diet_plan_meal_groups_plan_day_meal_type_idx" ON "diet_plan_meal_groups" USING btree ("diet_plan_id","day_of_week","meal_type");--> statement-breakpoint
CREATE INDEX "diet_plan_meal_items_group_id_idx" ON "diet_plan_meal_items" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "diet_plan_meal_items_food_id_idx" ON "diet_plan_meal_items" USING btree ("food_id");--> statement-breakpoint
CREATE INDEX "diet_plan_meals_diet_plan_id_idx" ON "diet_plan_meals" USING btree ("diet_plan_id");--> statement-breakpoint
CREATE INDEX "diet_plan_meals_food_id_idx" ON "diet_plan_meals" USING btree ("food_id");--> statement-breakpoint
CREATE INDEX "diet_plans_client_id_idx" ON "diet_plans" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "email_verification_challenge_user_id_idx" ON "email_verification_challenge" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_verification_challenge_email_idx" ON "email_verification_challenge" USING btree ("email");--> statement-breakpoint
CREATE INDEX "food_alt_measures_food_id_idx" ON "food_alt_measures" USING btree ("food_id");--> statement-breakpoint
CREATE INDEX "food_log_items_meal_id_idx" ON "food_log_items" USING btree ("meal_id");--> statement-breakpoint
CREATE INDEX "food_log_items_food_id_idx" ON "food_log_items" USING btree ("food_id");--> statement-breakpoint
CREATE INDEX "food_log_meals_user_id_idx" ON "food_log_meals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "food_log_meals_user_consumed_at_idx" ON "food_log_meals" USING btree ("user_id","consumed_at");--> statement-breakpoint
CREATE INDEX "food_log_meals_user_meal_type_consumed_at_idx" ON "food_log_meals" USING btree ("user_id","meal_type","consumed_at");--> statement-breakpoint
CREATE INDEX "food_logs_user_id_idx" ON "food_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "food_logs_food_id_idx" ON "food_logs" USING btree ("food_id");--> statement-breakpoint
CREATE INDEX "food_logs_consumed_at_idx" ON "food_logs" USING btree ("consumed_at");--> statement-breakpoint
CREATE INDEX "food_photos_food_id_idx" ON "food_photos" USING btree ("food_id");--> statement-breakpoint
CREATE INDEX "foods_name_idx" ON "foods" USING btree ("name");--> statement-breakpoint
CREATE INDEX "foods_source_id_idx" ON "foods" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "foods_source_idx" ON "foods" USING btree ("source");--> statement-breakpoint
CREATE INDEX "foods_user_id_idx" ON "foods" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "foods_is_custom_idx" ON "foods" USING btree ("is_custom");--> statement-breakpoint
CREATE INDEX "nutrition_goals_user_id_idx" ON "nutrition_goals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "nutrition_goals_user_start_date_idx" ON "nutrition_goals" USING btree ("user_id","start_date");--> statement-breakpoint
CREATE INDEX "nutrition_goals_user_end_date_idx" ON "nutrition_goals" USING btree ("user_id","end_date");--> statement-breakpoint
CREATE INDEX "security_event_user_id_created_at_idx" ON "security_event" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "security_event_type_created_at_idx" ON "security_event" USING btree ("type","created_at");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_token_idx" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verification" USING btree ("identifier");