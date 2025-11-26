import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthorityService } from './authorityService';

// Mock localStorage for Node.js environment
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

// Setup global localStorage mock
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('Authority Service', () => {
  let service: AuthorityService;

  beforeEach(() => {
    mockLocalStorage.clear();
    service = new AuthorityService();
  });

  afterEach(() => {
    mockLocalStorage.clear();
  });

  describe('Password Validation', () => {
    it('should validate correct password', () => {
      const isValid = service.validatePassword('314159265Pi');
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', () => {
      const isValid = service.validatePassword('wrongpassword');
      expect(isValid).toBe(false);
    });

    it('should reject empty password', () => {
      const isValid = service.validatePassword('');
      expect(isValid).toBe(false);
    });

    it('should be case sensitive', () => {
      const isValid = service.validatePassword('314159265pi');
      expect(isValid).toBe(false);
    });
  });

  describe('Authentication', () => {
    it('should authenticate with correct password', () => {
      const result = service.authenticate('314159265Pi');
      expect(result).toBe(true);
    });

    it('should reject authentication with wrong password', () => {
      const result = service.authenticate('wrongpassword');
      expect(result).toBe(false);
    });

    it('should set authenticated state on success', () => {
      service.authenticate('314159265Pi');
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should not set authenticated state on failure', () => {
      service.authenticate('wrongpassword');
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should save session to localStorage', () => {
      service.authenticate('314159265Pi');
      const stored = mockLocalStorage.getItem('authority_authenticated');
      expect(stored).not.toBeNull();
      const session = JSON.parse(stored!);
      expect(session.authenticated).toBe(true);
    });
  });

  describe('Session Management', () => {
    it('should check if authenticated', () => {
      expect(service.isAuthenticated()).toBe(false);
      service.authenticate('314159265Pi');
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should logout and clear session', () => {
      service.authenticate('314159265Pi');
      expect(service.isAuthenticated()).toBe(true);
      
      service.logout();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should remove session from localStorage on logout', () => {
      service.authenticate('314159265Pi');
      expect(mockLocalStorage.getItem('authority_authenticated')).not.toBeNull();
      
      service.logout();
      expect(mockLocalStorage.getItem('authority_authenticated')).toBeNull();
    });

    it('should calculate session time remaining', () => {
      service.authenticate('314159265Pi');
      const remaining = service.getSessionTimeRemaining();
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(24 * 60); // 24 hours in minutes
    });

    it('should return 0 minutes when not authenticated', () => {
      const remaining = service.getSessionTimeRemaining();
      expect(remaining).toBe(0);
    });
  });

  describe('Session Persistence', () => {
    it('should load valid session from localStorage', () => {
      const now = Date.now();
      const session = {
        authenticated: true,
        timestamp: now,
        expiresAt: now + 24 * 60 * 60 * 1000
      };
      mockLocalStorage.setItem('authority_authenticated', JSON.stringify(session));
      
      const newService = new AuthorityService();
      expect(newService.isAuthenticated()).toBe(true);
    });

    it('should reject expired session from localStorage', () => {
      const now = Date.now();
      const session = {
        authenticated: true,
        timestamp: now - 25 * 60 * 60 * 1000,
        expiresAt: now - 1 * 60 * 60 * 1000
      };
      mockLocalStorage.setItem('authority_authenticated', JSON.stringify(session));
      
      const newService = new AuthorityService();
      expect(newService.isAuthenticated()).toBe(false);
    });

    it('should handle corrupted localStorage data', () => {
      mockLocalStorage.setItem('authority_authenticated', 'invalid json');
      
      const newService = new AuthorityService();
      expect(newService.isAuthenticated()).toBe(false);
    });
  });

  describe('Subscriptions', () => {
    it('should notify subscribers on authentication', () => {
      let notified = false;
      let authenticated = false;

      service.subscribe((auth) => {
        notified = true;
        authenticated = auth;
      });

      service.authenticate('314159265Pi');
      expect(notified).toBe(true);
      expect(authenticated).toBe(true);
    });

    it('should notify subscribers on logout', () => {
      service.authenticate('314159265Pi');
      
      let notified = false;
      let authenticated = true;

      service.subscribe((auth) => {
        notified = true;
        authenticated = auth;
      });

      service.logout();
      expect(notified).toBe(true);
      expect(authenticated).toBe(false);
    });

    it('should allow unsubscribing', () => {
      let callCount = 0;

      const unsubscribe = service.subscribe(() => {
        callCount++;
      });

      service.authenticate('314159265Pi');
      expect(callCount).toBe(1);

      unsubscribe();

      service.logout();
      expect(callCount).toBe(1);
    });

    it('should support multiple subscribers', () => {
      let count1 = 0;
      let count2 = 0;

      service.subscribe(() => count1++);
      service.subscribe(() => count2++);

      service.authenticate('314159265Pi');
      expect(count1).toBe(1);
      expect(count2).toBe(1);
    });
  });

  describe('Session Duration', () => {
    it('should have 24 hour session duration', () => {
      service.authenticate('314159265Pi');
      const remaining = service.getSessionTimeRemaining();
      
      expect(remaining).toBeGreaterThan(1439);
      expect(remaining).toBeLessThanOrEqual(1440);
    });

    it('should expire session after 24 hours', async () => {
      service.authenticate('314159265Pi');
      expect(service.isAuthenticated()).toBe(true);

      const now = Date.now();
      vi.useFakeTimers();
      vi.setSystemTime(new Date(now + 25 * 60 * 60 * 1000));

      expect(service.isAuthenticated()).toBe(false);

      vi.useRealTimers();
    });
  });
});
