-- Fix deletion policies for public users
-- Public users should not be able to delete lists created by other users
-- They should only be able to delete todo items that they created themselves
-- EXCEPT: List creators can delete any todo in their lists

-- First, drop the existing overly permissive deletion policies
DROP POLICY IF EXISTS "Anyone can delete todos from public lists" ON todos;
DROP POLICY IF EXISTS "Anonymous users can delete todos from their anonymous lists" ON todos;

-- Create a new policy that allows users to delete their own todos OR todos in lists they created
-- This applies to both authenticated and anonymous users
CREATE POLICY "Users can delete their own todos or todos in their lists" ON todos
  FOR DELETE USING (
    -- Authenticated users can delete todos they created
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    -- Authenticated users can delete any todo in lists they created
    (auth.uid() IS NOT NULL AND 
     EXISTS (
       SELECT 1 FROM todo_lists 
       WHERE id = todos.todo_list_id AND user_id = auth.uid()
     )
    ) OR
    -- Anonymous users can delete todos they created (where user_id is null and they have session access)
    (auth.uid() IS NULL AND user_id IS NULL AND 
     EXISTS (
       SELECT 1 FROM todo_lists 
       WHERE id = todos.todo_list_id AND 
       (is_public = true OR (is_anonymous = true AND anonymous_session_id IS NOT NULL))
     )
    ) OR
    -- Anonymous users can delete any todo in lists they created
    (auth.uid() IS NULL AND 
     EXISTS (
       SELECT 1 FROM todo_lists 
       WHERE id = todos.todo_list_id AND 
       is_anonymous = true AND 
       anonymous_session_id IS NOT NULL
     )
    )
  );

-- The existing list deletion policies are already correct:
-- - "Users can delete their own todo lists" - only allows users to delete their own lists
-- - "Anonymous users can delete their lists" - only allows anonymous users to delete their own anonymous lists

-- Verify the current policies
-- This will show all current policies for reference
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
WHERE tablename IN ('todo_lists', 'todos')
ORDER BY tablename, policyname;
