CREATE TYPE "public"."goal_type" AS ENUM('weight_loss', 'maintenance', 'weight_gain');--> statement-breakpoint
CREATE TYPE "public"."meal_type" AS ENUM('breakfast', 'lunch', 'dinner', 'snack');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('individual', 'professional', 'admin');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TABLE "custom_foods" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(500) NOT NULL,
	"brand_name" varchar(500),
	"serving_qty" numeric(10, 2) NOT NULL,
	"serving_unit" varchar(100) NOT NULL,
	"calories" numeric(10, 2) NOT NULL,
	"protein" numeric(10, 2),
	"carbs" numeric(10, 2),
	"fat" numeric(10, 2),
	"fiber" numeric(10, 2),
	"sugar" numeric(10, 2),
	"sodium" numeric(10, 2),
	"photo_url" varchar(500),
	"is_public" boolean DEFAULT false,
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
	"user_id" integer NOT NULL,
	"client_id" integer,
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
CREATE TABLE "food_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"food_id" integer NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"serving_unit" varchar(100),
	"meal_type" "meal_type" NOT NULL,
	"consumed_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "foods" (
	"id" serial PRIMARY KEY NOT NULL,
	"nutritionix_id" varchar(100),
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
	"full_nutrients" jsonb,
	"photo_url" varchar(500),
	"upc" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "foods_nutritionix_id_unique" UNIQUE("nutritionix_id")
);
--> statement-breakpoint
CREATE TABLE "nutrition_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"goal_type" "goal_type" NOT NULL,
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
CREATE TABLE "professional_verification" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"license_number" varchar(100),
	"specialification" text,
	"credentials" jsonb,
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"avatar" varchar(500),
	"role" "user_role" DEFAULT 'individual' NOT NULL,
	"email_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "custom_foods" ADD CONSTRAINT "custom_foods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diet_plan_meals" ADD CONSTRAINT "diet_plan_meals_diet_plan_id_diet_plans_id_fk" FOREIGN KEY ("diet_plan_id") REFERENCES "public"."diet_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diet_plan_meals" ADD CONSTRAINT "diet_plan_meals_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diet_plans" ADD CONSTRAINT "diet_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diet_plans" ADD CONSTRAINT "diet_plans_client_id_users_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_logs" ADD CONSTRAINT "food_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_logs" ADD CONSTRAINT "food_logs_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nutrition_goals" ADD CONSTRAINT "nutrition_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professional_verification" ADD CONSTRAINT "professional_verification_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "custom_foods_user_id_idx" ON "custom_foods" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "custom_foods_name_idx" ON "custom_foods" USING btree ("name");--> statement-breakpoint
CREATE INDEX "diet_plan_meals_diet_plan_id_idx" ON "diet_plan_meals" USING btree ("diet_plan_id");--> statement-breakpoint
CREATE INDEX "diet_plan_meals_food_id_idx" ON "diet_plan_meals" USING btree ("food_id");--> statement-breakpoint
CREATE INDEX "diet_plans_user_id_idx" ON "diet_plans" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "diet_plans_client_id_idx" ON "diet_plans" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "food_logs_user_id_idx" ON "food_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "food_logs_food_id_idx" ON "food_logs" USING btree ("food_id");--> statement-breakpoint
CREATE INDEX "food_logs_consumed_at_idx" ON "food_logs" USING btree ("consumed_at");--> statement-breakpoint
CREATE INDEX "foods_name_idx" ON "foods" USING btree ("name");--> statement-breakpoint
CREATE INDEX "foods_nutritionix_id_idx" ON "foods" USING btree ("nutritionix_id");--> statement-breakpoint
CREATE INDEX "foods_upc_idx" ON "foods" USING btree ("upc");--> statement-breakpoint
CREATE INDEX "nutrition_goals_user_id_idx" ON "nutrition_goals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "professional_verification_user_id_idx" ON "professional_verification" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");