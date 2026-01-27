CREATE INDEX "idx_foods_name_lower" ON "foods" USING btree (lower("name"));--> statement-breakpoint
CREATE INDEX "idx_foods_brand_lower" ON "foods" USING btree (lower("brand_name"));