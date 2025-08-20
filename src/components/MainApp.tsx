import { useState } from 'react'
import { todoService } from '../services/todoService'
import { anonymousService } from '../services/anonymousService'
import type { TodoList } from '../types'
import { useAuth } from '../contexts/AuthContext'

interface MainAppProps {
  todoLists: TodoList[]
  setTodoLists: (lists: TodoList[]) => void
  setError: (error: string | null) => void
  loadTodoLists: () => Promise<void>
}

export default function MainApp({
  todoLists,
  setTodoLists,
  setError,
  loadTodoLists
}: MainAppProps) {
  const { user } = useAuth()
  const [newListTitle, setNewListTitle] = useState('')
  const [showNewListModal, setShowNewListModal] = useState(false)
  const [isCreatingList, setIsCreatingList] = useState(false)

  const handleCreateList = async () => {
    if (!newListTitle.trim()) return

    setIsCreatingList(true)
    try {
      const newList = await todoService.createTodoList(newListTitle.trim())
      setTodoLists([newList, ...todoLists])
      setNewListTitle('')
      setShowNewListModal(false)
      await loadTodoLists() // Refresh the list
    } catch (err) {
      setError('Failed to create list')
    } finally {
      setIsCreatingList(false)
    }
  }

  const handleToggleListPrivacy = async (list: TodoList) => {
    try {
      const updatedList = await todoService.updateTodoList(list.id, { is_public: !list.is_public })
      setTodoLists(todoLists.map(l => l.id === list.id ? updatedList : l))
    } catch (err) {
      setError('Failed to update list privacy')
    }
  }

  const handleDeleteList = async (listId: string) => {
    try {
      await todoService.deleteTodoList(listId)
      setTodoLists(todoLists.filter(l => l.id !== listId))
    } catch (err) {
      setError('Failed to delete list')
    }
  }

  const shareList = (list: TodoList) => {
    const url = `${window.location.origin}/?list=${list.id}`
    navigator.clipboard.writeText(url).then(() => {
      // You could add a toast notification here
      alert('List URL copied to clipboard!')
    })
  }

  const openList = (listId: string) => {
    // Navigate to the individual list view
    window.location.href = `/?list=${listId}`
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Your Lists</h1>
        <p className="text-gray-600">
          {user ? 'Manage your todo lists and collaborate with others.' : 'Create and manage your todo lists. Sign in to save them permanently.'}
        </p>
      </div>

      {/* Lists Section */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* New List Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
          <button
            onClick={() => setShowNewListModal(true)}
            className="w-full h-32 flex flex-col items-center justify-center text-gray-500 hover:text-blue-600 transition-colors"
          >
            <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="font-medium">New List</span>
          </button>
        </div>

        {/* Existing Lists */}
        {todoLists.map((list) => (
          <div
            key={list.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-800 flex-1 mr-2">{list.title}</h3>
              <div className="flex items-center gap-2">
                {/* Privacy Toggle */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={list.is_public}
                    onChange={(e) => {
                      e.stopPropagation()
                      handleToggleListPrivacy(list)
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                
                {/* Privacy Pill */}
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  list.is_public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {list.is_public ? 'Public' : 'Private'}
                </span>
              </div>
            </div>

            {/* Anonymous Warning */}
            {list.is_anonymous && (
              <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                ⏰ Expires in {anonymousService.getDaysRemaining()} days
              </div>
            )}

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span>{new Date(list.created_at).toLocaleDateString()}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => openList(list.id)}
                className="flex-1 bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                Open List
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  shareList(list)
                }}
                className="p-2 hover:bg-gray-100 rounded text-gray-600"
                title="Share list"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteList(list.id)
                }}
                className="p-2 hover:bg-red-100 rounded text-red-600"
                title="Delete list"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {todoLists.length === 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No lists yet</h3>
          <p className="text-gray-600 mb-6">Create your first todo list to get started</p>
          <button
            onClick={() => setShowNewListModal(true)}
            className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Create Your First List
          </button>
        </div>
      )}

      {/* New List Modal */}
      {showNewListModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New List</h3>
            <input
              type="text"
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              placeholder="Enter list title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleCreateList}
                disabled={isCreatingList || !newListTitle.trim()}
                className="flex-1 bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingList ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => setShowNewListModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
