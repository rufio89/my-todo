import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { todoService } from '../services/todoService'
import { anonymousService } from '../services/anonymousService'

export default function LoginPage() {
  const { signInWithGoogle } = useAuth()
  const [newListTitle, setNewListTitle] = useState('')
  const [isCreatingList, setIsCreatingList] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newListTitle.trim()) return

    setIsCreatingList(true)
    setError(null)

    try {
      const newList = await todoService.createTodoList(newListTitle.trim())
      // Automatically redirect to the new list
      window.location.href = `/?list=${newList.id}`
    } catch (err) {
      setError('Failed to create list. Please try again.')
      console.error('Error creating list:', err)
      setIsCreatingList(false)
    }
  }

  const handleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (err) {
      setError('Failed to sign in. Please try again.')
      console.error('Error signing in:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
            <span className="text-3xl font-bold text-white">M</span>
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            memora
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create, share, and collaborate on todo lists. Start instantly or sign in to save your work permanently.
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-start">
          {/* Left Side - Create List */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Your First List</h2>
            
            <form onSubmit={handleCreateList} className="space-y-4">
              <div>
                <label htmlFor="listTitle" className="block text-sm font-medium text-gray-700 mb-2">
                  List Title
                </label>
                <input
                  id="listTitle"
                  type="text"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  placeholder="e.g., Shopping List, Work Tasks..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isCreatingList || !newListTitle.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isCreatingList ? 'Creating...' : 'Create List'}
              </button>
            </form>

            {/* Anonymous Warning */}
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h4 className="font-medium text-amber-800">Anonymous List</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    This list will expire in 7 days. Sign in to save it permanently and access it from any device.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Sign In */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Sign In & Save Forever</h2>
            
            <div className="space-y-6">
              <div className="text-center">
                <button
                  onClick={handleSignIn}
                  className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
              </div>

              <div className="text-center">
                <p className="text-gray-600 mb-4">Already have an account?</p>
                <button
                  onClick={handleSignIn}
                  className="text-blue-600 hover:text-blue-700 font-medium underline"
                >
                  Sign in here
                </button>
              </div>
            </div>

            {/* Benefits */}
            <div className="mt-8 space-y-4">
              <h3 className="font-semibold text-gray-800">Why Sign In?</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-600">Lists never expire</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-600">Access from any device</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-600">Private lists and collaboration</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-8 max-w-md mx-auto p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-center">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center text-gray-500">
          <p>&copy; 2024 memora. Create, organize, and collaborate on your todos.</p>
        </div>
      </div>
    </div>
  )
}
