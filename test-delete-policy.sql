-- Test script to add a simple delete policy for todos
-- This will help us determine if RLS policies are blocking deletion

-- First, let's see what policies currently exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'todos';

-- Add a simple, permissive delete policy for testing
-- This allows ANYONE to delete ANY todo (for testing purposes only)
CREATE POLICY "Test: Allow all todo deletions" ON todos
  FOR DELETE USING (true);

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'todos' AND policyname = 'Test: Allow all todo deletions';
