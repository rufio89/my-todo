import { useState, useEffect } from 'react'
import { todoService } from '../services/todoService'
import { anonymousService } from '../services/anonymousService'
import type { Todo, TodoList } from '../types'
import { supabase } from '../supabase'

interface TodoListViewProps {
  listId: string
  onNavigate: (page: 'home' | 'profile' | 'list') => void
}

export default function TodoListView({ listId }: TodoListViewProps) {
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

  useEffect(() => {
    loadListAndTodos()
  }, [listId])

  const loadListAndTodos = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get the list details
      const { data: listData, error: listError } = await supabase
        .from('todo_lists')
        .select('*')
        .eq('id', listId)
        .single()

      if (listError || !listData) {
        setError('List not found or not accessible')
        setLoading(false)
        return
      }

      setList(listData)
      setEditTitle(listData.title)

      // Get todos for this list
      try {
        const todosData = await todoService.getTodos(listId)
        setTodos(todosData)
      } catch (todoError) {
        // Don't fail completely if todos fail to load, just show empty list
        setTodos([])
      }

    } catch (err) {
      setError('Failed to load list')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleTodo = async (todo: Todo) => {
    try {
      const updatedTodo = await todoService.updateTodo(todo.id, { completed: !todo.completed })
      setTodos(todos.map(t => t.id === todo.id ? updatedTodo : t))
    } catch (err) {
      setError('Failed to update todo')
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

  const handleDeleteTodo = async (todoId: string) => {
    try {
      await todoService.deleteTodo(todoId)
      
      // Fallback: manually remove from UI if real-time isn't working
      setTodos(prev => prev.filter(t => t.id !== todoId))
      
      // Don't manually remove from todos - let real-time subscription handle it
    } catch (err) {
      setError('Failed to delete todo')
    }
  }

  const handleToggleListPrivacy = async () => {
    if (!list) return
    
    try {
      const updatedList = await todoService.updateTodoList(list.id, { is_public: !list.is_public })
      setList(updatedList)
    } catch (err) {
      setError('Failed to update list privacy')
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
    try {
      await todoService.deleteTodoList(list!.id)
      handleGoHome()
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
          if (payload.eventType === 'INSERT') {
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
          } else if (payload.eventType === 'UPDATE') {
            setTodos(prev => {
              const updatedTodos = prev.map(todo => 
                todo.id === payload.new.id ? payload.new as Todo : todo
              )
              // Re-sort after update to maintain priority order
              return updatedTodos.sort((a, b) => {
                if (a.completed !== b.completed) {
                  return a.completed ? 1 : -1 // incomplete first
                }
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime() // newest first
              })
            })
          } else if (payload.eventType === 'DELETE') {
            setTodos(prev => 
              prev.filter(todo => todo.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [listId])

  const handleGoHome = () => {
    // Navigate back to home by clearing the URL parameter
    window.location.href = window.location.pathname
  }

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
        <div className="text-center max-w-md mx-auto">
          <div className="text-2xl mb-4">❌</div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading List</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setError(null)
                setLoading(true)
                loadListAndTodos()
              }}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
            >
              Try Again
            </button>
            <button
              onClick={handleGoHome}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Go Home
            </button>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            <p>List ID: {listId}</p>
            <p>If this persists, check the browser console for details.</p>
          </div>
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleGoHome}
            className="text-gray-600 hover:text-gray-800 mb-4 inline-flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Lists
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {isEditingTitle ? (
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleSaveTitle}
                    onKeyPress={(e) => e.key === 'Enter' && handleSaveTitle()}
                    className="text-3xl font-bold text-gray-800 bg-transparent border-b-2 border-gray-300 focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    ✓
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-gray-800">{list.title}</h1>
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✏️
                  </button>
                </div>
              )}
              
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                <span>Created: {new Date(list.created_at).toLocaleDateString()}</span>
                {list.is_anonymous && (
                  <span className="text-amber-600 font-medium">
                    ⏰ Expires in {anonymousService.getDaysRemaining()} days
                  </span>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Privacy Toggle */}
              <div className="flex items-center gap-3 px-4 py-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={list.is_public}
                    onChange={handleToggleListPrivacy}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  list.is_public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {list.is_public ? 'Public' : 'Private'}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={shareList}
                  className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  Share
                </button>
                <button
                  onClick={handleDeleteList}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-red-100 hover:text-red-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
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
                  <button
                    onClick={() => handleDeleteTodo(todo.id)}
                    className="p-1 hover:bg-red-100 rounded text-red-600"
                    title="Delete todo"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
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
