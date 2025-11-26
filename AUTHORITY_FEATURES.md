# Authority Authentication System

## Overview

The OMNI Wealth Terminal includes an exclusive authority authentication system that unlocks advanced features and real-time market predictions. Users can authenticate with a password to access premium functionality.

## Authentication Details

**Authority Password:** `314159265Pi`

### Session Duration
- **24 hours** from authentication
- Sessions persist across browser refreshes via localStorage
- Automatic logout after 24 hours of inactivity

## Features Unlocked by Authority Access

### 1. Authority Prediction Line
When authenticated, the chart displays an exclusive **purple prediction line** that shows:
- Advanced algorithmic price predictions
- Confidence interval (shaded area around the prediction)
- Trend-aware oscillations based on market momentum
- Real-time updates as market conditions change

**Visual Indicators:**
- Purple glowing line showing predicted price movement
- Shaded confidence zone around the prediction
- "⚡ AUTHORITY MODE" indicator in chart header
- "AUTHORITY PREDICTION" label on the chart

### 2. Authority Dashboard
Displays exclusive information when authenticated:
- **Session Time Remaining** - Shows how many minutes until session expires
- **Exclusive Features** - Lists all unlocked capabilities
- **Status Indicator** - Confirms all authority features are active
- **Logout Button** - Securely end the authority session

### 3. Advanced Market Analysis
Authority users get access to:
- Real-time prediction algorithms
- Enhanced technical indicator analysis
- Exclusive trading signals
- Advanced risk assessment

## How to Authenticate

### Step 1: Click "UNLOCK AUTHORITY ACCESS"
The purple button in the right panel opens the authentication modal.

### Step 2: Enter Password
Enter the authority password: `314159265Pi`

### Step 3: Confirm
Click "UNLOCK ACCESS" to authenticate.

### Result
- Authority Dashboard appears in place of the unlock button
- Prediction line becomes visible on the chart
- Session timer shows remaining time
- All exclusive features are now active

## Session Management

### View Session Status
The Authority Dashboard shows:
- Remaining session time in minutes
- List of active exclusive features
- Status confirmation

### Logout
Click the "LOGOUT" button in the Authority Dashboard to:
- End the current session
- Clear authentication from localStorage
- Hide the prediction line
- Return to standard mode

### Automatic Expiration
Sessions automatically expire after 24 hours:
- No action required
- Prediction line disappears
- Must re-authenticate to unlock features again

## Technical Implementation

### Authentication Service (`authorityService.ts`)
```typescript
// Check if currently authenticated
const isAuthenticated = authorityService.isAuthenticated();

// Authenticate with password
const success = authorityService.authenticate('314159265Pi');

// Logout
authorityService.logout();

// Get remaining session time (in minutes)
const minutesRemaining = authorityService.getSessionTimeRemaining();

// Subscribe to authentication changes
const unsubscribe = authorityService.subscribe((authenticated) => {
  console.log('Authority status:', authenticated);
});
```

### UI Components

#### AuthorityLoginModal
- Secure password input field
- Error handling and feedback
- Visual confirmation of authentication
- Accessible modal with keyboard support

#### AuthorityDashboard
- Session information display
- Feature list
- Logout functionality
- Real-time session countdown

#### Chart Component
- Conditional prediction line rendering
- Authority mode indicator
- Prediction confidence visualization
- Real-time updates

## Security Considerations

### Password Protection
- Password is hardcoded in the service (not ideal for production)
- Passwords are never sent to the server
- Authentication is client-side only
- Sessions are stored in browser localStorage

### Session Security
- Sessions expire after 24 hours
- Sessions persist across page refreshes
- Logout clears all session data
- No sensitive data is stored

### Best Practices
1. **For Production:** Implement server-side authentication
2. **For Production:** Use secure password hashing and validation
3. **For Production:** Implement OAuth or JWT tokens
4. **For Production:** Add rate limiting on authentication attempts
5. **For Production:** Use HTTPS for all communications

## Testing

Authority authentication is covered by 23 comprehensive unit tests:

```bash
# Run all tests
pnpm test

# Results:
# ✓ 23 Authority Service tests
# - Password validation (4 tests)
# - Authentication (5 tests)
# - Session management (5 tests)
# - Session persistence (3 tests)
# - Subscriptions (4 tests)
# - Session duration (2 tests)
```

### Test Coverage
- ✓ Correct password validation
- ✓ Incorrect password rejection
- ✓ Session creation and persistence
- ✓ Session expiration
- ✓ localStorage integration
- ✓ Subscriber notifications
- ✓ Multiple concurrent sessions
- ✓ Corrupted data handling

## API Reference

### AuthorityService

#### Methods

**`validatePassword(password: string): boolean`**
- Validates if the provided password matches the authority password
- Returns `true` if password is correct, `false` otherwise

**`authenticate(password: string): boolean`**
- Authenticates the user with the provided password
- Creates a session valid for 24 hours
- Saves session to localStorage
- Returns `true` on success, `false` on failure
- Notifies all subscribers on authentication

**`isAuthenticated(): boolean`**
- Checks if the user is currently authenticated
- Returns `false` if session has expired
- Returns `true` if valid session exists

**`logout(): void`**
- Ends the current session
- Clears localStorage
- Notifies all subscribers
- Resets authentication state

**`getSessionTimeRemaining(): number`**
- Returns remaining session time in minutes
- Returns `0` if not authenticated
- Returns `0` if session has expired

**`subscribe(listener: (authenticated: boolean) => void): () => void`**
- Subscribe to authentication state changes
- Called when user authenticates or logs out
- Returns unsubscribe function

### Interfaces

**`AuthoritySession`**
```typescript
interface AuthoritySession {
  authenticated: boolean;  // Is session active
  timestamp: number;       // When session was created
  expiresAt: number;      // When session expires
}
```

## Troubleshooting

### "Invalid authority password" error
- Check that you entered the password exactly: `314159265Pi`
- Password is case-sensitive
- Verify no extra spaces before or after

### Prediction line not showing
- Verify you are authenticated (check Authority Dashboard)
- Check that session has not expired
- Refresh the page to reload the chart

### Session expired unexpectedly
- Sessions last exactly 24 hours
- Check the "Session Time Remaining" in Authority Dashboard
- Re-authenticate to continue using exclusive features

### localStorage not working
- Check browser privacy settings
- Ensure localStorage is enabled
- Try clearing browser cache and cookies
- Try a different browser

## Future Enhancements

1. **Server-side Authentication** - Move password validation to backend
2. **Multi-factor Authentication** - Add 2FA for enhanced security
3. **Role-based Access Control** - Different authority levels with different features
4. **Audit Logging** - Track all authentication events
5. **Session Management Dashboard** - View all active sessions
6. **Biometric Authentication** - Support fingerprint/face recognition
7. **Single Sign-On (SSO)** - Integrate with enterprise authentication systems

## Support

For issues with authority authentication:
1. Check this documentation
2. Review the test cases in `authorityService.test.ts`
3. Check browser console for error messages
4. Verify localStorage is enabled in browser settings
5. Try clearing browser cache and cookies
