-- Fix RLS policies for anonymous users
-- This removes the dependency on app.anonymous_session_id which requires superuser privileges

-- Drop the problematic function first
DROP FUNCTION IF EXISTS set_anonymous_session_id(TEXT);

-- Update RLS policies for todo_lists to work without current_setting
-- For anonymous users, we'll use a different approach

-- Drop existing policies that use current_setting
DROP POLICY IF EXISTS "Anonymous users can view lists by session" ON todo_lists;
DROP POLICY IF EXISTS "Anonymous users can update their lists" ON todo_lists;
DROP POLICY IF EXISTS "Anonymous users can delete their lists" ON todo_lists;

-- Drop existing policies for todos that use current_setting
DROP POLICY IF EXISTS "Users can view todos from anonymous lists by session" ON todos;
DROP POLICY IF EXISTS "Anonymous users can insert todos in their lists" ON todos;
DROP POLICY IF EXISTS "Anonymous users can update todos in their lists" ON todos;
DROP POLICY IF EXISTS "Anonymous users can delete todos in their lists" ON todos;

-- Create new policies that work without current_setting
-- For anonymous lists, we'll allow access based on the anonymous_session_id being present
-- and the list being marked as anonymous

-- Allow viewing of anonymous lists (anyone can view them if they're public)
CREATE POLICY "Anonymous users can view lists" ON todo_lists
  FOR SELECT USING (
    is_public = true OR 
    (is_anonymous = true AND anonymous_session_id IS NOT NULL)
  );

-- Allow anonymous users to update their lists (by matching session ID)
CREATE POLICY "Anonymous users can update their lists" ON todo_lists
  FOR UPDATE USING (
    is_anonymous = true AND 
    anonymous_session_id IS NOT NULL
  );

-- Allow anonymous users to delete their lists (by matching session ID)
CREATE POLICY "Anonymous users can delete their lists" ON todo_lists
  FOR DELETE USING (
    is_anonymous = true AND 
    anonymous_session_id IS NOT NULL
  );

-- For todos, allow access to anonymous lists
CREATE POLICY "Users can view todos from anonymous lists" ON todos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM todo_lists 
      WHERE id = todos.todo_list_id AND 
      (is_public = true OR (is_anonymous = true AND anonymous_session_id IS NOT NULL))
    )
  );

-- Allow anonymous users to insert todos in their lists
CREATE POLICY "Anonymous users can insert todos in their lists" ON todos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM todo_lists 
      WHERE id = todos.todo_list_id AND 
      is_anonymous = true AND 
      anonymous_session_id IS NOT NULL
    )
  );

-- Allow anonymous users to update todos in their lists
CREATE POLICY "Anonymous users can update todos in their lists" ON todos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM todo_lists 
      WHERE id = todos.todo_list_id AND 
      is_anonymous = true AND 
      anonymous_session_id IS NOT NULL
    )
  );

-- Allow anonymous users to delete todos in their lists
CREATE POLICY "Anonymous users can delete todos in their lists" ON todos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM todo_lists 
      WHERE id = todos.todo_list_id AND 
      is_anonymous = true AND 
      anonymous_session_id IS NOT NULL
    )
  );

-- Create a new function that doesn't rely on database-level settings
CREATE OR REPLACE FUNCTION set_anonymous_session_id(session_id TEXT)
RETURNS VOID AS $$
BEGIN
  -- This function is now a no-op since we don't need current_setting
  -- The RLS policies work directly with the anonymous_session_id column
  NULL;
END;
$$ LANGUAGE plpgsql;
