import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../supabase'
import type { AuthState } from '../types'

interface AuthContextType extends AuthState {
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
  })

  useEffect(() => {
    console.log('AuthContext: Setting up auth listener')
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthContext: Initial session:', session)
      setAuthState({
        user: session?.user ? {
          id: session.user.id,
          email: session.user.email || '',
          user_metadata: session.user.user_metadata
        } : null,
        loading: false,
      })
    }).catch(error => {
      console.error('AuthContext: Error getting initial session:', error)
      setAuthState({
        user: null,
        loading: false,
      })
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth state change:', event, session)
        setAuthState({
          user: session?.user ? {
            id: session.user.id,
            email: session.user.email || '',
            user_metadata: session.user.user_metadata
          } : null,
          loading: false,
        })
      }
    )

    return () => {
      console.log('AuthContext: Cleaning up subscription')
      subscription.unsubscribe()
    }
  }, [])

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('Error signing in with Google:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  const value: AuthContextType = {
    ...authState,
    signInWithGoogle,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
