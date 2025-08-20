import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../supabase'
import type { User } from '../types'
import { anonymousService } from '../services/anonymousService'

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          const userData = {
            id: session.user.id,
            email: session.user.email!,
            user_metadata: session.user.user_metadata
          }
          setUser(userData)
          
          // Migrate any anonymous lists to this user's account
          migrateAnonymousLists(session.user.id).catch((err) => {
            // Continue even if migration fails
          })
        }
        
        setLoading(false)
      } catch (error) {
        setLoading(false)
      }
    }

    getInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const userData = {
          id: session.user.id,
          email: session.user.email!,
          user_metadata: session.user.user_metadata
        }
        setUser(userData)
        
        // Migrate any anonymous lists to this user's account
        migrateAnonymousLists(session.user.id).catch((err) => {
          // Continue even if migration fails
        })
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const migrateAnonymousLists = async (userId: string) => {
    try {
      // Get the anonymous session ID from localStorage
      const sessionId = anonymousService.getSessionId()
      if (!sessionId) {
        return
      }

      // Set the anonymous session ID in Supabase
      try {
        await supabase.rpc('set_anonymous_session_id', { session_id: sessionId })
      } catch (rpcError) {
        // Continue even if RPC fails
      }

      // Get all anonymous lists for this session
      const { data: anonymousLists, error: listsError } = await supabase
        .from('todo_lists')
        .select('*')
        .eq('anonymous_session_id', sessionId)
        .eq('is_anonymous', true)

      if (listsError || !anonymousLists || anonymousLists.length === 0) {
        return
      }

      // Update all anonymous lists to belong to this user
      const updatePromises = anonymousLists.map(list => 
        supabase
          .from('todo_lists')
          .update({ 
            user_id: userId, 
            is_anonymous: false, 
            anonymous_session_id: null,
            expires_at: null
          })
          .eq('id', list.id)
      )

      await Promise.all(updatePromises)
      
      // Clear the anonymous session ID from localStorage
      anonymousService.clearSession()
      
    } catch (error) {
      // Continue even if migration fails
    }
  }

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
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      throw error
    }
  }

  const value = {
    user,
    loading,
    signInWithGoogle,
    signOut
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
