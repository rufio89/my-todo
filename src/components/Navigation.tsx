import { useAuth } from '../contexts/AuthContext'

interface NavigationProps {
  currentPage: 'home' | 'profile' | 'list'
  onNavigate: (page: 'home' | 'profile' | 'list') => void
}

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
      // Redirect to home page after signing out
      onNavigate('home')
    } catch (error) {
      // Handle sign out error silently
    }
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <h1 
              className="text-xl font-bold text-gray-800 cursor-pointer hover:text-gray-600 transition-colors"
              onClick={() => onNavigate('home')}
            >
              memora
            </h1>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => onNavigate('home')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 'home'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Home
            </button>
            {user && (
              <button
                onClick={() => onNavigate('profile')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === 'profile'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Profile
              </button>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                {/* User Info */}
                <div className="hidden sm:flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    {user.user_metadata?.avatar_url ? (
                      <img 
                        src={user.user_metadata.avatar_url} 
                        alt="Profile" 
                        className="w-8 h-8 rounded-full"
                        onError={(e) => {
                          // Hide the broken image and show the person icon
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                    ) : null}
                    <span className={`text-sm font-medium text-gray-700 ${user.user_metadata?.avatar_url ? 'hidden' : ''}`}>
                      👤
                    </span>
                  </div>
                  <span className="text-sm text-gray-700 hidden md:block">
                    {user.user_metadata?.full_name || user.email}
                  </span>
                </div>

                {/* Sign Out Button */}
                <button
                  onClick={handleSignOut}
                  className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">Not signed in</span>
                <button
                  onClick={() => window.location.reload()} // This will trigger the login flow
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
