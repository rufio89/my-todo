import { supabase } from '../supabase'
import type { TodoList, Todo } from '../types'

export const todoService = {
  // Todo Lists
  async getTodoLists(): Promise<TodoList[]> {
    const { data, error } = await supabase
      .from('todo_lists')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async createTodoList(name: string): Promise<TodoList> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')
    
    const { data, error } = await supabase
      .from('todo_lists')
      .insert([{ name, user_id: user.id }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

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

  async deleteTodoList(id: string): Promise<void> {
    const { error } = await supabase
      .from('todo_lists')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Todos
  async getTodosByListId(listId: string): Promise<Todo[]> {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('list_id', listId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  async createTodo(listId: string, text: string): Promise<Todo> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')
    
    const { data, error } = await supabase
      .from('todos')
      .insert([{ list_id: listId, text, user_id: user.id }])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

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

  async deleteTodo(id: string): Promise<void> {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async deleteCompletedTodos(listId: string): Promise<void> {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('list_id', listId)
      .eq('completed', true)
    
    if (error) throw error
  }
}
