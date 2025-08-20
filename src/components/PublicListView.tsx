import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import type { Todo, TodoList } from '../types'

interface PublicListViewProps {
  listId: string
}

export function PublicListView({ listId }: PublicListViewProps) {
  const [list, setList] = useState<TodoList | null>(null)
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPublicList()
  }, [listId])

  // Set up real-time subscription for public list updates
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
          // Refresh the todos when changes occur
          loadPublicList()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [listId])

  const loadPublicList = async () => {
    try {
      setLoading(true)
      
      // First check if the list is public
      const { data: listData, error: listError } = await supabase
        .from('todo_lists')
        .select('*')
        .eq('id', listId)
        .eq('is_public', true)
        .single()

      if (listError || !listData) {
        setError('List not found or not public')
        return
      }

      setList(listData)

      // Load todos for the public list
      const { data: todosData, error: todosError } = await supabase
        .from('todos')
        .select('*')
        .eq('todo_list_id', listId)
        .order('created_at', { ascending: false })

      if (todosError) {
        setError('Failed to load todos')
        return
      }

      setTodos(todosData || [])
    } catch (err) {
      setError('Failed to load list')
      console.error('Error loading public list:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleTodo = async (todoId: string, completed: boolean) => {
    try {
      // Update the todo in the database
      const { data: updatedTodo, error } = await supabase
        .from('todos')
        .update({ completed })
        .eq('id', todoId)
        .select()
        .single()

      if (error) {
        console.error('Error updating todo:', error)
        return
      }

      // Update the local state
      setTodos(todos.map(todo => 
        todo.id === todoId ? { ...todo, completed } : todo
      ))
    } catch (err) {
      console.error('Error toggling todo:', err)
    }
  }

  if (loading) {
    return (
      <div className="text-center">
        <div className="text-2xl mb-2">⏳</div>
        <p className="text-gray-600">Loading public list...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center">
        <div className="text-2xl mb-2">❌</div>
        <p className="text-red-600 mb-4">{error}</p>
        <p className="text-gray-600">This list may be private or no longer available.</p>
      </div>
    )
  }

  if (!list) {
    return (
      <div className="text-center">
        <div className="text-2xl mb-2">❌</div>
        <p className="text-red-600">List not found</p>
      </div>
    )
  }

  return (
    <div>
      {/* List Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{list.title}</h2>
          <div className="flex items-center justify-center gap-2">
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              Public List
            </span>
            <span className="text-gray-500 text-sm">
              Created {new Date(list.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        <p className="text-gray-600 text-center">
          This is a public list shared by another user. You can check off completed todos, and changes will sync in real-time for everyone viewing the list.
        </p>
      </div>

      {/* Todos */}
      <div className="space-y-3">
        {todos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No todos in this list yet.</p>
          </div>
        ) : (
          todos.map((todo) => (
            <div key={todo.id} className="bg-white rounded-lg shadow-sm p-4 flex items-center">
              <button
                onClick={() => toggleTodo(todo.id, !todo.completed)}
                className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                  todo.completed
                    ? 'bg-gray-800 border-gray-800 hover:bg-gray-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                title={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
              >
                {todo.completed && (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              
              <span className={`flex-1 ml-3 text-gray-800 ${
                todo.completed ? 'line-through text-gray-500' : ''
              }`}>
                {todo.title}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="text-center mt-8">
        <p className="text-gray-600">
          Want to create your own lists? <a href="/" className="text-gray-800 underline hover:text-gray-600">Sign in with Google</a>
        </p>
      </div>
    </div>
  )
}
