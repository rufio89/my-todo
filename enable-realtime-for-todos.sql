-- Enable real-time for the todos table
-- This is required for DELETE events to work properly

-- 1. Check if real-time is currently enabled for the todos table
SELECT 
  schemaname,
  tablename,
  hasreplication
FROM pg_tables 
WHERE tablename = 'todos';

-- 2. Enable real-time for the todos table
-- This is the most common cause of DELETE events not working
ALTER PUBLICATION supabase_realtime ADD TABLE todos;

-- 3. Verify the table is now in the publication
SELECT 
  pubname,
  tablename,
  pubinsert,
  pubupdate,
  pubdelete
FROM pg_publication_tables 
WHERE tablename = 'todos';

-- 4. Check if there are any RLS policies that might interfere with real-time
SELECT 
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'todos';

-- 5. Verify the table structure is correct for real-time
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'todos'
ORDER BY ordinal_position;

-- 6. Check if the table has the necessary permissions
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'todos';
