import { supabase } from '../supabase'
import type { Todo, TodoList } from '../types'

export const todoService = {
  // Get all todo lists (user's own + public ones)
  async getTodoLists(): Promise<TodoList[]> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      // If no user, only get public lists
      const { data, error } = await supabase
        .from('todo_lists')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    }

    // If user is authenticated, get their lists + public lists
    // Use separate queries to avoid OR syntax issues
    const [userListsResult, publicListsResult] = await Promise.all([
      supabase
        .from('todo_lists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('todo_lists')
        .select('*')
        .eq('is_public', true)
        .neq('user_id', user.id) // Exclude user's own lists to avoid duplicates
        .order('created_at', { ascending: false })
    ])

    if (userListsResult.error) throw userListsResult.error
    if (publicListsResult.error) throw publicListsResult.error

    // Combine and sort by creation date
    const allLists = [...(userListsResult.data || []), ...(publicListsResult.data || [])]
    return allLists.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  },

  // Get todos for a specific list
  async getTodos(listId: string): Promise<Todo[]> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      // If no user, only get todos from public lists
      const { data: listData, error: listError } = await supabase
        .from('todo_lists')
        .select('is_public')
        .eq('id', listId)
        .single()
      
      if (listError) throw listError
      if (!listData?.is_public) {
        throw new Error('Access denied: List is private')
      }
    }

    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('todo_list_id', listId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Create a new todo list
  async createTodoList(title: string): Promise<TodoList> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('todo_lists')
      .insert([
        {
          title,
          user_id: user.id,
          is_public: true // Default to public
        }
      ])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Create a new todo
  async createTodo(title: string, listId: string): Promise<Todo> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('todos')
      .insert([
        {
          title,
          todo_list_id: listId,
          user_id: user.id
        }
      ])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update a todo
  async updateTodo(id: string, updates: Partial<Todo>): Promise<Todo> {
    const { data, error } = await supabase
      .from('todos')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete a todo
  async deleteTodo(id: string): Promise<void> {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Update a todo list (including public/private toggle)
  async updateTodoList(id: string, updates: Partial<TodoList>): Promise<TodoList> {
    const { data, error } = await supabase
      .from('todo_lists')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete a todo list
  async deleteTodoList(id: string): Promise<void> {
    const { error } = await supabase
      .from('todo_lists')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
