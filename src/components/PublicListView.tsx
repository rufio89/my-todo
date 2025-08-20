import { useState, useEffect } from 'react'
import { todoService } from '../services/todoService'
import { anonymousService } from '../services/anonymousService'
import type { Todo, TodoList } from '../types'
import { supabase } from '../supabase'

interface PublicListViewProps {
  listId: string
}

export function PublicListView({ listId }: PublicListViewProps) {
  const [list, setList] = useState<TodoList | null>(null)
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newTodoText, setNewTodoText] = useState('')
  const [isAddingTodo, setIsAddingTodo] = useState(false)

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
        .eq('is_public', true)
        .single()

      if (listError || !listData) {
        setError('List not found or not accessible')
        setLoading(false)
        return
      }

      setList(listData)

      // Get todos for this list
      const todosData = await todoService.getTodos(listId)
      setTodos(todosData)

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
      const newTodo = await todoService.createTodo(newTodoText.trim(), listId)
      setTodos([newTodo, ...todos])
      setNewTodoText('')
    } catch (err) {
      setError('Failed to add todo')
    } finally {
      setIsAddingTodo(false)
    }
  }

  // Set up real-time subscription for todos
  useEffect(() => {
    if (!listId) return

    const subscription = supabase
      .channel(`public-todos-${listId}`)
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
            setTodos(prev => [payload.new as Todo, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setTodos(prev => 
              prev.map(todo => 
                todo.id === payload.new.id ? payload.new as Todo : todo
              )
            )
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">{list.title}</h1>
          <p className="text-gray-600 mb-4">
            This is a public todo list. You can view and check off items, and changes sync in real-time.
          </p>
          
          {/* Anonymous Warning */}
          {list.is_anonymous && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">
                This list expires in {anonymousService.getDaysRemaining()} days
              </span>
            </div>
          )}

          {/* Sign In Prompt */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto">
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500">
          <p>Share this list with others using the URL above</p>
        </div>
      </div>
    </div>
  )
}
