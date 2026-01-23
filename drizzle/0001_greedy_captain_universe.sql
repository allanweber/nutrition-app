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
ALTER TABLE "nutrition_goals" ADD COLUMN "age_years" integer;--> statement-breakpoint
ALTER TABLE "nutrition_goals" ADD COLUMN "sex" varchar(20);--> statement-breakpoint
ALTER TABLE "nutrition_goals" ADD COLUMN "height_cm" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "nutrition_goals" ADD COLUMN "weight_kg" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "nutrition_goals" ADD COLUMN "activity_multiplier" numeric(6, 3);--> statement-breakpoint
ALTER TABLE "nutrition_goals" ADD COLUMN "goal_rate_kg_per_week" numeric(6, 3);--> statement-breakpoint
ALTER TABLE "nutrition_goals" ADD COLUMN "macro_preset_id" varchar(50);--> statement-breakpoint
ALTER TABLE "nutrition_goals" ADD COLUMN "protein_g_per_kg" numeric(6, 2);--> statement-breakpoint
ALTER TABLE "nutrition_goals" ADD COLUMN "bmr_calories" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "nutrition_goals" ADD COLUMN "tdee_calories" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "nutrition_goals" ADD COLUMN "recommended_targets" jsonb;--> statement-breakpoint
ALTER TABLE "nutrition_goals" ADD COLUMN "was_manually_overridden" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "nutrition_goals" ADD COLUMN "calorie_adjustment_strategy" varchar(30);--> statement-breakpoint
ALTER TABLE "nutrition_goals" ADD COLUMN "input_unit_system" varchar(10);--> statement-breakpoint
ALTER TABLE "nutrition_goals" ADD COLUMN "wizard_inputs" jsonb;--> statement-breakpoint
ALTER TABLE "body_checkins" ADD CONSTRAINT "body_checkins_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "body_checkins" ADD CONSTRAINT "body_checkins_goal_id_nutrition_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."nutrition_goals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "body_checkins_user_id_idx" ON "body_checkins" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "body_checkins_user_check_in_date_idx" ON "body_checkins" USING btree ("user_id","check_in_date");--> statement-breakpoint
CREATE INDEX "body_checkins_goal_id_check_in_date_idx" ON "body_checkins" USING btree ("goal_id","check_in_date");--> statement-breakpoint
CREATE INDEX "nutrition_goals_user_start_date_idx" ON "nutrition_goals" USING btree ("user_id","start_date");--> statement-breakpoint
CREATE INDEX "nutrition_goals_user_end_date_idx" ON "nutrition_goals" USING btree ("user_id","end_date");