import { useState, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import { todoService } from './services/todoService'
import { supabase } from './supabase'
import type { Todo, TodoList } from './types'
import LoginPage from './components/LoginPage'
import MainApp from './components/MainApp'
import { Navigation } from './components/Navigation'
import { ProfilePage } from './components/ProfilePage'
import { PublicListView } from './components/PublicListView'
import { TodoListView } from './components/TodoListView'
import { AuthCallback } from './components/AuthCallback'

type Page = 'home' | 'profile' | 'list'

export default function App() {
  const { user, loading: authLoading } = useAuth()
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [todoLists, setTodoLists] = useState<TodoList[]>([])
  const [error, setError] = useState<string | null>(null)

  // Check if there's a list parameter in the URL for public access
  const urlParams = new URLSearchParams(window.location.search)
  const listParam = urlParams.get('list')

  // Load todo lists
  const loadTodoLists = async () => {
    try {
      const lists = await todoService.getTodoLists()
      setTodoLists(lists)
    } catch (err) {
      setError('Failed to load todo lists')
    }
  }

  // Load data when component mounts or user changes
  useEffect(() => {
    if (user) {
      loadTodoLists()
    }
  }, [user])

  // Handle navigation
  const handleNavigate = (page: 'home' | 'profile' | 'list') => {
    if (page === 'list') {
      // Handle list navigation if needed
      return
    }
    
    // If navigating to home and there's a list parameter, clear it and force navigation
    if (page === 'home' && listParam) {
      window.location.href = window.location.pathname
      return
    }
    
    setCurrentPage(page as Page)
  }

  // Render the appropriate component based on current state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (window.location.pathname === '/auth/callback') {
    return <AuthCallback />
  }

  if (!user) {
    // Check if there's a list parameter in the URL for public access
    if (listParam) {
      return <PublicListView listId={listParam} />
    }
    
    return <LoginPage />
  }

  // User is authenticated
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
      
      {currentPage === 'home' && (
        <MainApp
          todoLists={todoLists}
          setTodoLists={setTodoLists}
          setError={setError}
          loadTodoLists={loadTodoLists}
        />
      )}
      
      {currentPage === 'profile' && <ProfilePage onNavigate={handleNavigate} />}
    </div>
  )
}
