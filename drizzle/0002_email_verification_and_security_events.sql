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
ALTER TABLE "email_verification_challenge" ADD CONSTRAINT "email_verification_challenge_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_event" ADD CONSTRAINT "security_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_verification_challenge_user_id_idx" ON "email_verification_challenge" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_verification_challenge_email_idx" ON "email_verification_challenge" USING btree ("email");--> statement-breakpoint
CREATE INDEX "security_event_user_id_created_at_idx" ON "security_event" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "security_event_type_created_at_idx" ON "security_event" USING btree ("type","created_at");