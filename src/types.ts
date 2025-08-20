export interface TodoList {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface Todo {
  id: string
  list_id: string
  text: string
  completed: boolean
  created_at: string
  updated_at: string
}

export interface TodoWithList extends Todo {
  todo_lists: TodoList
}

export interface User {
  id: string
  email: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}

export interface AuthState {
  user: User | null
  loading: boolean
}
