import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabase'
import { useState } from 'react'

interface ProfilePageProps {
  onNavigate: (page: 'home' | 'profile' | 'list') => void
}

export function ProfilePage({ onNavigate }: ProfilePageProps) {
  const { user } = useAuth()
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateMessage, setUpdateMessage] = useState('')

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to view your profile.</p>
        </div>
      </div>
    )
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => onNavigate('home')}
            className="text-gray-600 hover:text-gray-800 mb-4 inline-flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account and preferences</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Profile Information */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
            
            <div className="space-y-4">
              {/* Avatar */}
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
                  {user.user_metadata?.avatar_url ? (
                    <img 
                      src={user.user_metadata.avatar_url} 
                      alt="Profile" 
                      className="w-20 h-20 rounded-full"
                      onError={(e) => {
                        // Hide the broken image and show the person icon
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                  ) : null}
                  <span className={`text-4xl ${user.user_metadata?.avatar_url ? 'hidden' : ''}`}>
                    👤
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {user.user_metadata?.full_name || 'User'}
                  </h3>
                  <p className="text-gray-600">{user.email}</p>
                </div>
              </div>

              {/* User Details */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{user.email}</p>
                </div>
                
                {user.user_metadata?.full_name && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <p className="mt-1 text-sm text-gray-900">{user.user_metadata.full_name}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">User ID</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono text-xs">{user.id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Account Status</label>
                <div className="mt-1 flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-900">Active</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Authentication Provider</label>
                <p className="mt-1 text-sm text-gray-900">Google OAuth</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Member Since</label>
                <p className="mt-1 text-sm text-gray-900">
                  Recently
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Additional Features */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Preferences & Settings</h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Notifications</h3>
              <p className="text-sm text-gray-600">Manage your notification preferences</p>
              <button className="mt-2 text-sm text-blue-600 hover:text-blue-800">
                Configure →
              </button>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Privacy</h3>
              <p className="text-sm text-gray-600">Control your privacy settings</p>
              <button className="mt-2 text-sm text-blue-600 hover:text-blue-800">
                Manage →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
