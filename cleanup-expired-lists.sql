-- Cleanup script for expired anonymous lists
-- Run this script periodically (e.g., daily) to remove expired anonymous lists

-- Delete expired anonymous lists and their associated todos
-- This will cascade delete todos due to the ON DELETE CASCADE constraint

DELETE FROM todo_lists 
WHERE is_anonymous = true 
  AND expires_at IS NOT NULL 
  AND expires_at < NOW();

-- Optional: Log the cleanup operation
-- You can create a cleanup_logs table to track when this runs

-- Example cleanup_logsWhe table structure:
-- CREATE TABLE IF NOT EXISTS cleanup_logs (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   cleaned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   lists_removed INTEGER,
--   todos_removed INTEGER
-- );

-- Example logging query (uncomment if you have cleanup_logs table):
-- INSERT INTO cleanup_logs (lists_removed, todos_removed)
-- SELECT 
--   COUNT(*) as lists_removed,
--   COALESCE(SUM(todo_count), 0) as todos_removed
-- FROM (
--   SELECT 
--     tl.id,
--     (SELECT COUNT(*) FROM todos t WHERE t.todo_list_id = tl.id) as todo_count
--   FROM todo_lists tl
--   WHERE tl.is_anonymous = true 
--     AND tl.expires_at IS NOT NULL 
--     AND tl.expires_at < NOW()
-- ) expired_lists;

-- View current anonymous lists and their expiration status
-- Useful for monitoring before cleanup
SELECT 
  id,
  title,
  created_at,
  expires_at,
  EXTRACT(EPOCH FROM (expires_at - NOW())) / 86400 as days_until_expiry
FROM todo_lists 
WHERE is_anonymous = true 
  AND expires_at IS NOT NULL
ORDER BY expires_at ASC;
