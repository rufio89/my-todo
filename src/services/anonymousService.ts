// Service for managing anonymous user sessions and list expiration

const ANONYMOUS_SESSION_KEY = 'memora_anonymous_session_id'
const SESSION_DURATION_DAYS = 7

export interface AnonymousSession {
  id: string
  created_at: Date
  expires_at: Date
}

export const anonymousService = {
  // Generate or retrieve anonymous session ID
  getSessionId(): string {
    let sessionId = localStorage.getItem(ANONYMOUS_SESSION_KEY)
    
    if (!sessionId) {
      sessionId = this.generateSessionId()
      this.saveSession(sessionId)
    }
    
    return sessionId
  },

  // Generate a random session ID
  generateSessionId(): string {
    return 'anon_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  },

  // Save session to localStorage
  saveSession(sessionId: string): void {
    const session: AnonymousSession = {
      id: sessionId,
      created_at: new Date(),
      expires_at: new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000)
    }
    
    localStorage.setItem(ANONYMOUS_SESSION_KEY, sessionId)
    localStorage.setItem(ANONYMOUS_SESSION_KEY + '_data', JSON.stringify(session))
  },

  // Get session data
  getSessionData(): AnonymousSession | null {
    const sessionData = localStorage.getItem(ANONYMOUS_SESSION_KEY + '_data')
    if (!sessionData) return null
    
    try {
      const session = JSON.parse(sessionData)
      return {
        ...session,
        created_at: new Date(session.created_at),
        expires_at: new Date(session.expires_at)
      }
    } catch {
      return null
    }
  },

  // Check if session is expired
  isSessionExpired(): boolean {
    const session = this.getSessionData()
    if (!session) return true
    
    return new Date() > session.expires_at
  },

  // Get days remaining until expiration
  getDaysRemaining(): number {
    const session = this.getSessionData()
    if (!session) return 0
    
    const now = new Date()
    const timeRemaining = session.expires_at.getTime() - now.getTime()
    const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24))
    
    return Math.max(0, daysRemaining)
  },

  // Clear anonymous session (when user signs in)
  clearSession(): void {
    localStorage.removeItem(ANONYMOUS_SESSION_KEY)
    localStorage.removeItem(ANONYMOUS_SESSION_KEY + '_data')
  },

  // Check if user has anonymous lists
  hasAnonymousLists(): boolean {
    const sessionId = localStorage.getItem(ANONYMOUS_SESSION_KEY)
    return !!sessionId
  }
}
