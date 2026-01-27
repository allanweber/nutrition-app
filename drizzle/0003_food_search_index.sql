-- Add case-insensitive indexes for foods search

CREATE INDEX IF NOT EXISTS idx_foods_name_lower ON foods (lower(name));
CREATE INDEX IF NOT EXISTS idx_foods_brand_lower ON foods (lower(brand_name));
