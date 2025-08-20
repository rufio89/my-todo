import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if we have OAuth tokens in the hash
        if (window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          
          if (accessToken) {

            
            // Set the session with the tokens
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            })
            
            if (error) {
              setStatus('error')
              return
            }
            
            if (data.session) {

              setStatus('success')
              setTimeout(() => {
                window.location.href = '/'
              }, 1000)
              return
            }
          }
        }
        
        // Fallback: try to get existing session
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          setStatus('error')
          return
        }
        
        if (data.session) {
          setStatus('success')
          setTimeout(() => {
            window.location.href = '/'
          }, 1000)
        } else {
          setStatus('error')
        }
      } catch (error) {
        setStatus('error')
      }
    }

    handleAuthCallback()
  }, [])

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-xl text-gray-800 mb-2">Successfully signed in!</p>
          <p className="text-gray-600">Redirecting to your todo lists...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-xl text-gray-800 mb-2">Sign in failed</p>
          <p className="text-gray-600 mb-4">Please try again</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl mb-2">⏳</div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  )
}
