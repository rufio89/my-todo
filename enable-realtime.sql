-- Enable real-time for the todos table
-- This is required for real-time subscriptions to work

-- Enable real-time for the todos table
ALTER PUBLICATION supabase_realtime ADD TABLE todos;

-- Also enable real-time for todo_lists table if not already enabled
ALTER PUBLICATION supabase_realtime ADD TABLE todo_lists;

-- Verify the current real-time configuration
SELECT 
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
  AND tablename IN ('todos', 'todo_lists');
