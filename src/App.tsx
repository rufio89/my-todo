import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { todoService } from './services/todoService'
import type { TodoList, Todo } from './types'
import { useAuth } from './contexts/AuthContext'
import { LoginPage } from './components/LoginPage'
import { AuthCallback } from './components/AuthCallback'
import { MainApp } from './components/MainApp'
import { Navigation } from './components/Navigation'
import { ProfilePage } from './components/ProfilePage'
import './App.css'

function App() {
  const { user, loading: authLoading } = useAuth()
  const [todoLists, setTodoLists] = useState<TodoList[]>([])
  const [currentListId, setCurrentListId] = useState<string>('')
  const [currentTodos, setCurrentTodos] = useState<Todo[]>([])
  const [inputValue, setInputValue] = useState('')
  const [showCreateList, setShowCreateList] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [showShareModal, setShowShareModal] = useState(false)
  const [todosLoading, setTodosLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [appTitle, setAppTitle] = useState('Your To Do')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [showHomePage, setShowHomePage] = useState(true)
  const [currentPage, setCurrentPage] = useState<'home' | 'profile' | 'list'>('home')

  // Check if we're on the auth callback route
  const isAuthCallback = window.location.pathname === '/auth/callback'

  // Debug logging


  // Add a timeout fallback for loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      if (authLoading) {
    
        // Force loading to false after 5 seconds as a fallback
        // This will help debug if there's an issue with the auth context
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [authLoading])

  // Test Supabase connection
  useEffect(() => {
    const testSupabase = async () => {
              try {
          await supabase.from('todo_lists').select('count').limit(1)
        } catch (err) {
        console.error('Supabase test error:', err)
      }
    }
    
    if (user) {
      testSupabase()
    }
  }, [user])

  // Load todo lists from Supabase - only when authenticated
  useEffect(() => {
    if (user && !isAuthCallback) {
      loadTodoLists()
    }
  }, [user, isAuthCallback])

  // Set up real-time subscriptions - only when authenticated
  useEffect(() => {
    if (user && currentListId && !isAuthCallback) {
      loadTodos(currentListId)
      subscribeToTodos(currentListId)
    }
  }, [user, currentListId, isAuthCallback])

  // Check URL for list ID after todo lists are loaded - only when authenticated
  useEffect(() => {
    if (user && todoLists.length > 0 && !isAuthCallback) {
      const urlParams = new URLSearchParams(window.location.search)
      const listIdFromUrl = urlParams.get('list')
      
      if (listIdFromUrl) {
        const listExists = todoLists.find(list => list.id === listIdFromUrl)
        if (listExists) {
          setCurrentListId(listIdFromUrl)
          setShowHomePage(false)
          setCurrentPage('list')
          return
        }
      }
      
      // Don't automatically set a current list, stay on home page
      setShowHomePage(true)
      setCurrentPage('home')
    }
  }, [user, todoLists, isAuthCallback])

  // Update app title when current list changes
  useEffect(() => {
    if (user && currentListId && todoLists.length > 0 && !isAuthCallback) {
      const currentList = todoLists.find(list => list.id === currentListId)
      if (currentList) {
        setAppTitle(currentList.title)
      }
    }
  }, [user, currentListId, todoLists, isAuthCallback])

  const loadTodoLists = async () => {
    try {
      setTodosLoading(true)
      const lists = await todoService.getTodoLists()
      setTodoLists(lists)
      if (lists.length > 0 && !currentListId) {
        setCurrentListId(lists[0].id)
      }
    } catch (err) {
      setError('Failed to load todo lists')
      console.error('Error loading todo lists:', err)
    } finally {
      setTodosLoading(false)
    }
  }

  const loadTodos = async (listId: string) => {
    try {
      // Don't try to load todos if we don't have a valid list ID
      if (!listId || listId === 'temp') {
        setCurrentTodos([])
        return
      }
      
              const todos = await todoService.getTodos(listId)
      setCurrentTodos(todos)
    } catch (err) {
      console.error('Error loading todos:', err)
      // Don't show error for todo loading, just set empty array
      setCurrentTodos([])
    }
  }

  const subscribeToTodos = (listId: string) => {
    // Don't subscribe if we don't have a valid list ID
    if (!listId || listId === 'temp') {
      return
    }
    
    const subscription = supabase
      .channel(`todos-${listId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
          filter: `todo_list_id=eq.${listId}`
        },
        (payload) => {
  
          loadTodos(listId)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const handleNavigate = (page: 'home' | 'profile' | 'list') => {
    setCurrentPage(page)
    if (page === 'home') {
      setShowHomePage(true)
      setCurrentListId('')
    } else if (page === 'list' && currentListId) {
      setShowHomePage(false)
    }
  }

  // Render different components based on state
  if (isAuthCallback) {
    
    return <AuthCallback />
  }

  if (authLoading) {
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-2">⏳</div>
          <p className="text-gray-600">Loading...</p>
          <p className="text-sm text-gray-500 mt-2">Auth state: {authLoading ? 'Loading' : 'Loaded'}</p>
          <p className="text-sm text-gray-500">User: {user ? 'Present' : 'None'}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    
    return <LoginPage />
  }

  // If we get here, user is authenticated and we can render the main app
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
      
      {currentPage === 'profile' ? (
        <ProfilePage onNavigate={handleNavigate} />
      ) : (
        <MainApp 
          todoLists={todoLists}
          setTodoLists={setTodoLists}
          currentListId={currentListId}
          setCurrentListId={setCurrentListId}
          currentTodos={currentTodos}
          setCurrentTodos={setCurrentTodos}
          inputValue={inputValue}
          setInputValue={setInputValue}
          showCreateList={showCreateList}
          setShowCreateList={setShowCreateList}
          newListName={newListName}
          setNewListName={setNewListName}
          showShareModal={showShareModal}
          setShowShareModal={setShowShareModal}
          todosLoading={todosLoading}
          error={error}
          setError={setError}
          appTitle={appTitle}
          setAppTitle={setAppTitle}
          isEditingTitle={isEditingTitle}
          setIsEditingTitle={setIsEditingTitle}
          showHomePage={showHomePage}
          setShowHomePage={setShowHomePage}
        />
      )}
    </div>
  )
}

export default App
