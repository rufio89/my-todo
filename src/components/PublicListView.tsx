import { useState, useEffect, useCallback, useRef } from 'react'
import { todoService } from '../services/todoService'
import { anonymousService } from '../services/anonymousService'
import type { Todo, TodoList } from '../types'
import { supabase } from '../supabase'
import { Navigation } from './Navigation'

interface PublicListViewProps {
  listId: string
}

export function PublicListView({ listId }: PublicListViewProps) {
  const isMounted = useRef(true)
  const [list, setList] = useState<TodoList | null>(null)
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newTodoText, setNewTodoText] = useState('')
  const [isAddingTodo, setIsAddingTodo] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [showShareModal, setShowShareModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [currentPage] = useState<'home' | 'profile' | 'list'>('list')

  // Cleanup on unmount - only run when component actually unmounts
  useEffect(() => {
    isMounted.current = true
    
    return () => {
      isMounted.current = false
    }
  }, [])

  const handleNavigate = (page: 'home' | 'profile' | 'list') => {
    if (page === 'home') {
      window.location.href = '/'
    }
    // For anonymous users, profile navigation can redirect to login
    if (page === 'profile') {
      window.location.href = '/'
    }
  }

  const loadListAndTodos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Get the list details using todoService to ensure proper RLS handling
      const lists = await todoService.getTodoLists()
      const listData = lists.find(list => list.id === listId)

      if (!listData) {
        setError('List not found or not accessible')
        setLoading(false)
        return
      }

      setList(listData)

      // Get todos for this list
      const todosData = await todoService.getTodos(listId)
      setTodos(todosData)

    } catch (err) {
      console.error('PublicListView loadListAndTodos error:', err)
      setError(`Failed to load list: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }, [listId])

  useEffect(() => {
    loadListAndTodos()
  }, [loadListAndTodos])

  const handleToggleTodo = async (todo: Todo) => {
    try {
      const updatedTodo = await todoService.updateTodo(todo.id, { completed: !todo.completed })
      setTodos(todos.map(t => t.id === todo.id ? updatedTodo : t))
    } catch (err) {
      setError('Failed to update todo')
    }
  }

  const handleDeleteTodo = async (todoId: string) => {
    try {
      await todoService.deleteTodo(todoId)
      
      // Fallback: manually remove from UI if real-time isn't working
      setTodos(prev => prev.filter(t => t.id !== todoId))
      
      // Don't manually remove from todos - let real-time subscription handle it
    } catch (err) {
      console.error('PublicListView deleteTodo error:', err)
      setError(`Failed to delete todo: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodoText.trim()) return

    setIsAddingTodo(true)
    try {
      await todoService.createTodo(newTodoText.trim(), listId)
      // Don't manually add to todos - let real-time subscription handle it
      setNewTodoText('')
    } catch (err) {
      setError('Failed to add todo')
    } finally {
      setIsAddingTodo(false)
    }
  }

  const handleSaveTitle = async () => {
    if (!list || !editTitle.trim() || editTitle === list.title) {
      setIsEditingTitle(false)
      return
    }
    
    try {
      const updatedList = await todoService.updateTodoList(list.id, { title: editTitle.trim() })
      setList(updatedList)
      setIsEditingTitle(false)
    } catch (err) {
      setError('Failed to update list title')
    }
  }

  const handleDeleteList = async () => {
    if (!list) return
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!list) return
    try {
      await todoService.deleteTodoList(list.id)
      window.location.href = '/'
    } catch (err) {
      setError('Failed to delete list')
    }
  }

  const shareList = () => {
    if (!list) return
    
    const url = `${window.location.origin}/?list=${list.id}`
    navigator.clipboard.writeText(url).then(() => {
      setShowShareModal(true)
      // Auto-hide the modal after 3 seconds
      setTimeout(() => setShowShareModal(false), 3000)
    })
  }

  // Set up real-time subscription for todos
  useEffect(() => {
    if (!listId) return

    // Use a global channel name that both components can share
    const channelName = `todos-global-${listId}`

    // Create a single channel for all events
    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'todos',
          filter: `todo_list_id=eq.${listId}`
        },
        (payload) => {
          // Check if this todo already exists to prevent duplicates
          const todoExists = todos.some(todo => todo.id === payload.new.id)
          
          if (isMounted.current && !todoExists) {
            setTodos(prev => {
              const newTodos = [...prev, payload.new as Todo]
              
              // Sort to maintain priority: incomplete first, then by creation date
              return newTodos.sort((a, b) => {
                if (a.completed !== b.completed) {
                  return a.completed ? 1 : -1 // incomplete first
                }
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime() // newest first
              })
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'todos'
        },
        () => {
          // Just log the event, don't process it - let the filtered handler do the work
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'todos',
          filter: `todo_list_id=eq.${listId}`
        },
        (payload) => {
          if (isMounted.current) {
            setTodos(prev => {
              const updatedTodos = prev.map(todo => 
                todo.id === payload.new.id ? payload.new as Todo : todo
              )
              
              // Sort to maintain priority: incomplete first, then by creation date
              return updatedTodos.sort((a, b) => {
                if (a.completed !== b.completed) {
                  return a.completed ? 1 : -1 // incomplete first
                }
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime() // newest first
              })
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'todos',
          filter: `todo_list_id=eq.${listId}`
        },
        (payload) => {
          if (isMounted.current && payload.old && payload.old.id) {
            const deletedTodoId = payload.old.id
            
            setTodos(prev => {
              const filteredTodos = prev.filter(todo => todo.id !== deletedTodoId)
              return filteredTodos
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'todos'
        },
        (payload) => {
          // Fallback: If the filtered handler isn't working, manually process DELETE events
          if (payload.old?.id && isMounted.current) {
            // Remove the todo from the current state
            setTodos(prev => {
              const filteredTodos = prev.filter(todo => todo.id !== payload.old.id)
              return filteredTodos
            })
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Successfully subscribed to real-time updates
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Real-time subscription error for list:', listId)
        } else if (status === 'TIMED_OUT') {
          console.error('Real-time subscription timed out for list:', listId)
        } else if (status === 'CLOSED') {
          console.error('Real-time subscription closed for list:', listId)
        }
      })

    return () => {
      subscription.unsubscribe()
    }
  }, [listId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading list...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">❌</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  if (!list) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">List not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-3xl font-bold text-gray-800 bg-transparent border-b-2 border-blue-500 focus:outline-none focus:border-blue-600"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingTitle(false)
                      setEditTitle(list.title)
                    }}
                    className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-gray-800">{list.title}</h1>
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                    title="Edit title"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                Public
              </span>
              
              <button
                onClick={shareList}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                title="Share list"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367 2.684z" />
                </svg>
                Share
              </button>
              
              {/* Only show delete button if this is an anonymous list created by the current session */}
              {list.is_anonymous && list.anonymous_session_id === anonymousService.getSessionId() && (
                <button
                  onClick={handleDeleteList}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  title="Delete list"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              )}
            </div>
          </div>
          
          <p className="text-gray-600 mb-4">
            This is a public todo list. Anyone can view, add new items, and check off completed items. Changes sync in real-time.
          </p>
          
          {/* Anonymous Warning */}
          {list.is_anonymous && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h4 className="font-medium text-amber-800">Anonymous List</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    This list will expire in {anonymousService.getDaysRemaining()} days. Sign in to save it permanently.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sign In Prompt */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">
              💡 Want to save this list permanently? Sign in to create your own lists that never expire.
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="mt-2 text-blue-600 hover:text-blue-700 underline text-sm"
            >
              Sign in with Google
            </button>
          </div>
        </div>

        {/* Add Todo Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Add New Todo</h2>
          <form onSubmit={handleAddTodo} className="flex gap-3">
            <input
              type="text"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              placeholder="Enter a new todo..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isAddingTodo}
            />
            <button
              type="submit"
              disabled={isAddingTodo || !newTodoText.trim()}
              className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isAddingTodo ? 'Adding...' : 'Add'}
            </button>
          </form>
        </div>

        {/* Todos List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Todos</h2>
          
          {todos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No todos yet. Add your first one above!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggleTodo(todo)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className={`flex-1 ${todo.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                    {todo.title}
                  </span>
                  {/* Show delete button if user created the todo OR if user is the list creator */}
                  {(todo.user_id === null || list.user_id === null) && (
                    <button
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="p-1 hover:bg-red-100 rounded text-red-600"
                      title="Delete todo"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500">
          <p>Share this list with others to collaborate! Anyone with the link can add and complete todos. List creators can delete any item, while others can only delete their own.</p>
        </div>
      </div>

      {/* Share Success Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Link Copied!</h3>
            <p className="text-gray-600 mb-4">
              The list URL has been copied to your clipboard. Share it with others to collaborate!
            </p>
            <button
              onClick={() => setShowShareModal(false)}
              className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete List?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{list?.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
