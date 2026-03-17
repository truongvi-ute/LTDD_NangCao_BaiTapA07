-- Add missing columns to moments and comments if they don't exist
ALTER TABLE moments ADD COLUMN IF NOT EXISTS reaction_count BIGINT DEFAULT 0;
ALTER TABLE moments ADD COLUMN IF NOT EXISTS comment_count BIGINT DEFAULT 0;
ALTER TABLE moments ADD COLUMN IF NOT EXISTS save_count BIGINT DEFAULT 0;
ALTER TABLE moments ADD COLUMN IF NOT EXISTS report_count BIGINT DEFAULT 0;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS reaction_count BIGINT DEFAULT 0;

-- Update existing NULL values to 0
UPDATE moments SET reaction_count = 0 WHERE reaction_count IS NULL;
UPDATE moments SET comment_count = 0 WHERE comment_count IS NULL;
UPDATE moments SET save_count = 0 WHERE save_count IS NULL;
UPDATE moments SET report_count = 0 WHERE report_count IS NULL;
UPDATE comments SET reaction_count = 0 WHERE reaction_count IS NULL;
