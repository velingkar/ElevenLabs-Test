/**
 * Authentication Service
 * Handles SSO authentication using Firebase Auth
 */

import { 
  auth, 
  googleProvider, 
  microsoftProvider, 
  oktaProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type FirebaseUser
} from '../config/firebase';

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;
  private authStateListener: (() => void) | null = null;
  private authStateReady: Promise<void>;
  private resolveAuthStateReady: (() => void) | null = null;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  constructor() {
    // Create a promise that resolves when auth state is determined
    this.authStateReady = new Promise((resolve) => {
      this.resolveAuthStateReady = resolve;
    });

    // Set up Firebase auth state listener
    this.setupAuthStateListener();
  }

  /**
   * Set up Firebase auth state listener
   * This automatically restores the user session from localStorage on page load
   */
  private setupAuthStateListener(): void {
    this.authStateListener = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        this.currentUser = this.convertFirebaseUser(firebaseUser);
      } else {
        this.currentUser = null;
      }
      
      // Resolve the promise on first auth state change (initial load)
      if (this.resolveAuthStateReady) {
        this.resolveAuthStateReady();
        this.resolveAuthStateReady = null;
      }
    });
  }

  /**
   * Wait for auth state to be determined (waits for Firebase to restore session from localStorage)
   */
  async waitForAuthState(): Promise<void> {
    await this.authStateReady;
  }

  /**
   * Convert Firebase user to our User interface
   */
  private convertFirebaseUser(firebaseUser: FirebaseUser): User {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      picture: firebaseUser.photoURL || undefined,
    };
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null && auth.currentUser !== null;
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Get authentication token
   */
  async getToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (user) {
      try {
        const token = await user.getIdToken();
        return token;
      } catch (error) {
        console.error('Error getting token:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Login with SSO using Firebase
   */
  async loginWithSSO(provider: 'google' | 'microsoft' | 'okta' = 'google'): Promise<User> {
    try {
      let selectedProvider;
      
      switch (provider) {
        case 'google':
          selectedProvider = googleProvider;
          break;
        case 'microsoft':
          selectedProvider = microsoftProvider;
          break;
        case 'okta':
          selectedProvider = oktaProvider;
          break;
        default:
          selectedProvider = googleProvider;
      }

      const result = await signInWithPopup(auth, selectedProvider);
      const user = this.convertFirebaseUser(result.user);
      this.currentUser = user;
      return user;
    } catch (error: any) {
      console.error('SSO login error:', error);
      throw new Error(error.message || `Failed to sign in with ${provider}`);
    }
  }

  /**
   * Login with email/password using Firebase
   */
  async loginWithEmail(email: string, password: string): Promise<User> {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = this.convertFirebaseUser(result.user);
      this.currentUser = user;
      return user;
    } catch (error: any) {
      console.error('Email login error:', error);
      
      // Handle specific Firebase errors
      let errorMessage = 'Login failed. Please check your credentials.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Sign up with email/password using Firebase
   */
  async signUpWithEmail(email: string, password: string, displayName?: string): Promise<User> {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name if provided
      if (displayName && result.user) {
        // Note: To update displayName, you'd need to use updateProfile
        // This requires additional Firebase setup
      }
      
      const user = this.convertFirebaseUser(result.user);
      this.currentUser = user;
      return user;
    } catch (error: any) {
      console.error('Sign up error:', error);
      
      // Handle specific Firebase errors
      let errorMessage = 'Sign up failed. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
      this.currentUser = null;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Validate token (check if token is still valid)
   */
  async validateToken(): Promise<boolean> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return false;
      }

      // Refresh token to ensure it's valid
      await user.getIdToken(true);
      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  /**
   * Cleanup auth state listener
   */
  cleanup(): void {
    if (this.authStateListener) {
      this.authStateListener();
      this.authStateListener = null;
    }
  }
}

export default AuthService;
