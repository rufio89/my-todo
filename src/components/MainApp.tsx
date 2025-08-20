import { useEffect } from 'react'
import { todoService } from '../services/todoService'
import type { TodoList, Todo } from '../types'

interface MainAppProps {
  todoLists: TodoList[]
  setTodoLists: (lists: TodoList[]) => void
  currentListId: string
  setCurrentListId: (id: string) => void
  currentTodos: Todo[]
  setCurrentTodos: (todos: Todo[]) => void
  inputValue: string
  setInputValue: (value: string) => void
  showCreateList: boolean
  setShowCreateList: (show: boolean) => void
  newListName: string
  setNewListName: (name: string) => void
  showShareModal: boolean
  setShowShareModal: (show: boolean) => void
  todosLoading: boolean
  error: string | null
  setError: (error: string | null) => void
  appTitle: string
  setAppTitle: (title: string) => void
  isEditingTitle: boolean
  setIsEditingTitle: (editing: boolean) => void
  showHomePage: boolean
  setShowHomePage: (show: boolean) => void
}

export function MainApp({
  todoLists,
  setTodoLists,
  currentListId,
  setCurrentListId,
  currentTodos,
  setCurrentTodos,
  inputValue,
  setInputValue,
  showCreateList,
  setShowCreateList,
  newListName,
  setNewListName,
  showShareModal,
  setShowShareModal,
  todosLoading,
  error,
  setError,
  appTitle,
  setAppTitle,
  isEditingTitle,
  setIsEditingTitle,
  showHomePage,
  setShowHomePage
}: MainAppProps) {



  const createNewList = async () => {
    if (newListName.trim()) {
      try {
        const newList = await todoService.createTodoList(newListName.trim())
        setTodoLists([newList, ...todoLists])
        setNewListName('')
        setShowCreateList(false)
      } catch (err) {
        setError('Failed to create todo list')
        console.error('Error creating todo list:', err)
      }
    }
  }

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() && currentListId) {
      try {
        const newTodo = await todoService.createTodo(inputValue.trim(), currentListId)
        setCurrentTodos([...currentTodos, newTodo])
        setInputValue('')
      } catch (err) {
        setError('Failed to add todo')
        console.error('Error adding todo:', err)
      }
    }
  }

  const toggleTodo = async (id: string) => {
    try {
      const todo = currentTodos.find(t => t.id === id)
      if (todo) {
        const updatedTodo = await todoService.updateTodo(id, { completed: !todo.completed })
        setCurrentTodos(currentTodos.map(t => 
          t.id === id ? updatedTodo : t
        ))
      }
    } catch (err) {
      setError('Failed to update todo')
      console.error('Error updating todo:', err)
    }
  }

  const deleteTodo = async (id: string) => {
    try {
      await todoService.deleteTodo(id)
      setCurrentTodos(currentTodos.filter(t => t.id !== id))
    } catch (err) {
      setError('Failed to delete todo')
      console.error('Error deleting todo:', err)
    }
  }

  const deleteList = async (listId: string) => {
    try {
      await todoService.deleteTodoList(listId)
      const updatedLists = todoLists.filter(list => list.id !== listId)
      setTodoLists(updatedLists)
      
      if (currentListId === listId) {
        setCurrentListId(updatedLists.length > 0 ? updatedLists[0].id : '')
      }
    } catch (err) {
      setError('Failed to delete todo list')
      console.error('Error deleting todo list:', err)
    }
  }

  const toggleListPrivacy = async (listId: string, isPublic: boolean) => {
    try {
      const updatedList = await todoService.updateTodoList(listId, { is_public: isPublic })
      setTodoLists(todoLists.map(list => 
        list.id === listId ? updatedList : list
      ))
    } catch (err) {
      setError('Failed to update list privacy')
      console.error('Error updating list privacy:', err)
    }
  }

  const shareList = (listId: string) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?list=${listId}`
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShowShareModal(true)
      setTimeout(() => setShowShareModal(false), 2000)
    })
  }

  const remainingTodos = currentTodos.filter(todo => !todo.completed).length
  
  // Get the current list data for privacy toggle
  const currentList = todoLists.find(list => list.id === currentListId)

  const saveTitle = async () => {
    if (appTitle.trim() && currentListId) {
      try {
        const updatedList = await todoService.updateTodoList(currentListId, { title: appTitle.trim() })
        setTodoLists(todoLists.map(list => 
          list.id === currentListId ? updatedList : list
        ))
        setIsEditingTitle(false)
      } catch (err) {
        setError('Failed to save title')
        console.error('Error saving title:', err)
      }
    }
  }

  // Load todo lists when component mounts
  useEffect(() => {

    // The parent App component handles loading todo lists and subscriptions
  }, [])

  // Set up real-time subscriptions
  useEffect(() => {
    if (currentListId) {
  
      // The parent App component handles loading todos and subscriptions
    }
  }, [currentListId])

  if (todosLoading) {

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-2">⏳</div>
          <p className="text-gray-600">Loading your todo lists...</p>
          <p className="text-sm text-gray-500 mt-2">Loading state: {todosLoading ? 'Loading' : 'Loaded'}</p>
          <p className="text-sm text-gray-500">Todo lists count: {todoLists.length}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-2">❌</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null)
              // The parent App component handles loading todo lists
            }}
            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (todoLists.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Your To Do</h1>
          <p className="text-gray-600 mb-6">Get started with your first todo list</p>
          
          <div className="bg-white rounded-lg shadow-sm p-6 max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Create Your First List</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Enter list name..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded focus:outline-none focus:border-gray-400"
                onKeyPress={(e) => e.key === 'Enter' && createNewList()}
              />
              <button
                onClick={createNewList}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show home page with list of todo lists
  if (showHomePage) {
    return (
      <div className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Your To Do</h1>
            <p className="text-gray-600">Manage your todo lists</p>
          </div>

          {/* Create New List Form */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Create New List</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Enter list name..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded focus:outline-none focus:border-gray-400"
                onKeyPress={(e) => e.key === 'Enter' && createNewList()}
              />
              <button
                onClick={createNewList}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Create List
              </button>
            </div>
          </div>

          {/* List of Todo Lists */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {todoLists.map((list) => (
              <div key={list.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold text-gray-800">{list.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      list.is_public 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {list.is_public ? 'Public' : 'Private'}
                    </span>
                    <button
                      onClick={() => toggleListPrivacy(list.id, !list.is_public)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        list.is_public ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                      title={`Make ${list.is_public ? 'private' : 'public'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        list.is_public ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4">
                  Created {new Date(list.created_at).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setCurrentListId(list.id)
                      setShowHomePage(false)
                      const newUrl = `${window.location.origin}${window.location.pathname}?list=${list.id}`
                      window.history.pushState({}, '', newUrl)
                    }}
                    className="flex-1 px-3 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors text-sm"
                  >
                    Open List
                  </button>
                  <button
                    onClick={() => shareList(list.id)}
                    className="px-3 py-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors text-sm border border-gray-200"
                    title="Share list"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => deleteList(list.id)}
                    className="px-3 py-2 bg-gray-100 text-gray-500 rounded hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors text-sm border border-gray-200"
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
        </div>
      </div>
    )
  }

  return (
    <div className="py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header with Back Button */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={() => {
                setShowHomePage(true)
                setCurrentListId('')
                window.history.pushState({}, '', window.location.pathname)
              }}
              className="px-3 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
            >
              ← Back to Lists
            </button>
          </div>
          {isEditingTitle ? (
            <div className="flex items-center justify-center gap-2">
              <input
                type="text"
                value={appTitle}
                onChange={(e) => setAppTitle(e.target.value)}
                onBlur={() => saveTitle()}
                onKeyPress={(e) => e.key === 'Enter' && saveTitle()}
                className="text-3xl font-bold text-gray-800 text-center bg-transparent border-b-2 border-gray-300 focus:outline-none focus:border-gray-500"
                autoFocus
              />
              <button
                onClick={() => saveTitle()}
                className="text-gray-500 hover:text-gray-700"
              >
                ✓
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-3xl font-bold text-gray-800 cursor-pointer hover:text-gray-600" onClick={() => setIsEditingTitle(true)}>
                  {appTitle}
                </h1>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="text-gray-500 hover:text-gray-700 text-lg"
                >
                  ✏️
                </button>
              </div>
              

            </div>
          )}
        </div>

        {/* List Selector and Actions */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <button
                onClick={() => setShowCreateList(true)}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors whitespace-nowrap"
              >
                + New List
              </button>
            </div>
            
            {/* Public/Private Toggle */}
            <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded border border-gray-200">
              <span className={`text-xs px-2 py-1 rounded-full ${
                currentList?.is_public 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {currentList?.is_public ? 'Public' : 'Private'}
              </span>
              <button
                onClick={() => toggleListPrivacy(currentListId, !currentList?.is_public)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  currentList?.is_public ? 'bg-green-600' : 'bg-gray-300'
                }`}
                title={`Make ${currentList?.is_public ? 'private' : 'public'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  currentList?.is_public ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => shareList(currentListId)}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors whitespace-nowrap"
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                Share
              </button>
              <button
                onClick={() => deleteList(currentListId)}
                className="px-4 py-2 bg-gray-100 text-gray-500 rounded hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors whitespace-nowrap border border-gray-200"
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Create New List Modal */}
        {showCreateList && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                {todoLists.find(list => list.title === newListName) ? 'Rename List' : 'Create New List'}
              </h3>
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Enter list name..."
                className="w-full px-3 py-2 border border-gray-200 rounded focus:outline-none focus:border-gray-400 mb-4"
                onKeyPress={(e) => e.key === 'Enter' && createNewList()}
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    createNewList()
                  }}
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  {todoLists.find(list => list.title === newListName) ? 'Rename' : 'Create'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateList(false)
                    setNewListName('')
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Share Success Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="text-4xl mb-4">✅</div>
              <p className="text-lg font-semibold text-gray-800">Link Copied!</p>
              <p className="text-gray-600">Share this link with others to collaborate</p>
            </div>
          </div>
        )}

        {/* Add New Task Input */}
        <form onSubmit={addTodo} className="mb-8">
          <div className="flex items-center border-b-2 border-gray-200 pb-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Add new task"
              className="flex-1 text-lg outline-none bg-transparent text-gray-800 placeholder-gray-400"
            />
            <button
              type="submit"
              className="ml-4 w-10 h-10 bg-gray-800 text-white rounded flex items-center justify-center hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </form>

        {/* Todo List */}
        <div className="space-y-3 mb-8">
          {currentTodos.map((todo) => (
            <div key={todo.id} className="bg-white rounded-lg shadow-sm p-4 flex items-center">
              <button
                onClick={() => toggleTodo(todo.id)}
                className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                  todo.completed
                    ? 'bg-gray-800 border-gray-800'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
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
              
              <button
                onClick={() => deleteTodo(todo.id)}
                className="ml-3 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-800">
            Your remaining todos: {remainingTodos}
          </p>
        </div>
      </div>
    </div>
  )
}
