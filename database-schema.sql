-- Create todo_lists table
CREATE TABLE todo_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create todos table
CREATE TABLE todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  todo_list_id UUID REFERENCES todo_lists(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_todo_lists_user_id ON todo_lists(user_id);
CREATE INDEX idx_todos_todo_list_id ON todos(todo_list_id);
CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todo_lists_is_public ON todo_lists(is_public);

-- Enable Row Level Security
ALTER TABLE todo_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for todo_lists
CREATE POLICY "Users can view their own todo lists" ON todo_lists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public todo lists" ON todo_lists
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert their own todo lists" ON todo_lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own todo lists" ON todo_lists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own todo lists" ON todo_lists
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for todos
CREATE POLICY "Users can view todos from their own lists" ON todos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view todos from public lists" ON todos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM todo_lists 
      WHERE id = todos.todo_list_id AND is_public = true
    )
  );

CREATE POLICY "Users can insert todos in their own lists" ON todos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update todos in their own lists" ON todos
  FOR UPDATE USING (auth.uid() = user_id);

-- NEW POLICY: Allow public users to update todos on public lists (for completion status)
CREATE POLICY "Public users can update todos on public lists" ON todos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM todo_lists 
      WHERE id = todos.todo_list_id AND is_public = true
    )
  );

CREATE POLICY "Users can delete todos in their own lists" ON todos
  FOR DELETE USING (auth.uid() = user_id);
