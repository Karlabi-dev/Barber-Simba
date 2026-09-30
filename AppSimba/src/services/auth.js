import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, updateEmail, updatePassword, sendPasswordResetEmail, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth'
import { auth, authReady } from '../config/firebase'
import { createAuthService } from './createAuthService'

export const authService = createAuthService({
  auth,
  ready: authReady,
  sdk: { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, updateEmail, updatePassword, sendPasswordResetEmail, verifyPasswordResetCode, confirmPasswordReset },
})
