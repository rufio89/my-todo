export interface Todo {
  id: string
  title: string
  completed: boolean
  todo_list_id: string
  user_id: string
  created_at: string
}

export interface TodoList {
  id: string
  title: string
  user_id: string
  is_public: boolean
  created_at: string
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
