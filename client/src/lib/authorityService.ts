/**
 * Authority Authentication Service
 * Manages access to advanced features via password authentication
 */

const AUTHORITY_PASSWORD = '314159265Pi';
const STORAGE_KEY = 'authority_authenticated';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export interface AuthoritySession {
  authenticated: boolean;
  timestamp: number;
  expiresAt: number;
}

export class AuthorityService {
  private authenticated: boolean = false;
  private sessionStartTime: number = 0;
  private listeners: Set<(authenticated: boolean) => void> = new Set();

  constructor() {
    this.loadSession();
  }

  /**
   * Validate authority password
   */
  validatePassword(password: string): boolean {
    return password === AUTHORITY_PASSWORD;
  }

  /**
   * Authenticate with password
   */
  authenticate(password: string): boolean {
    if (!this.validatePassword(password)) {
      return false;
    }

    this.authenticated = true;
    this.sessionStartTime = Date.now();

    // Save to localStorage
    const session: AuthoritySession = {
      authenticated: true,
      timestamp: this.sessionStartTime,
      expiresAt: this.sessionStartTime + SESSION_DURATION
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));

    this.notifyListeners();
    return true;
  }

  /**
   * Check if currently authenticated
   */
  isAuthenticated(): boolean {
    if (!this.authenticated) {
      return false;
    }

    // Check if session has expired
    const expiresAt = this.sessionStartTime + SESSION_DURATION;
    if (Date.now() > expiresAt) {
      this.logout();
      return false;
    }

    return true;
  }

  /**
   * Logout and clear session
   */
  logout(): void {
    this.authenticated = false;
    this.sessionStartTime = 0;
    localStorage.removeItem(STORAGE_KEY);
    this.notifyListeners();
  }

  /**
   * Get time remaining in session (in minutes)
   */
  getSessionTimeRemaining(): number {
    if (!this.authenticated) {
      return 0;
    }

    const expiresAt = this.sessionStartTime + SESSION_DURATION;
    const remaining = expiresAt - Date.now();
    return Math.max(0, Math.ceil(remaining / 60000)); // Convert to minutes
  }

  /**
   * Load session from localStorage
   */
  private loadSession(): void {
    try {
      // Check if localStorage is available (not in Node.js test environment)
      if (typeof localStorage === 'undefined') {
        return;
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return;
      }

      const session: AuthoritySession = JSON.parse(stored);

      // Check if session is still valid
      if (Date.now() > session.expiresAt) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      this.authenticated = true;
      this.sessionStartTime = session.timestamp;
    } catch (error) {
      console.error('Failed to load authority session:', error);
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }

  /**
   * Subscribe to authentication changes
   */
  subscribe(listener: (authenticated: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.authenticated));
  }
}

// Global instance
export const authorityService = new AuthorityService();
