import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, Auth } from 'firebase/auth';
import { getAnalytics, Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCWha1sbZ1-zbTalGBQXWCvPOtQBmF1Fr8",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "modual-web-app.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "modual-web-app",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "modual-web-app.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "606603016078",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:606603016078:web:89412f34209425b14e96df",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-30T415NF98"
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase services
export const auth: Auth = getAuth(app);

// Initialize Analytics only on client side
let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics };

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Configure Google Provider to always show account selection
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Helper function to sign in with Google
export const signInWithGoogle = async () => {
  try {
    // Log the auth domain for debugging
    console.log('🔵 Firebase Auth Domain:', auth.app.options.authDomain);
    console.log('🔵 Current Domain:', typeof window !== 'undefined' ? window.location.hostname : 'unknown');
    
    const result = await signInWithPopup(auth, googleProvider);
    console.log('✅ Google sign-in successful');
    return result.user;
  } catch (error: any) {
    console.error('❌ Error signing in with Google:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Handle specific errors
    if (error.code === 'auth/popup-blocked') {
      throw new Error('Popup was blocked. Please allow popups for this site.');
    } else if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in cancelled. Please try again.');
    } else if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Another popup is already open.');
    } else if (error.code === 'auth/unauthorized-domain') {
      throw new Error('This domain is not authorized. Please contact support.');
    } else if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Google sign-in is not enabled. Please contact support.');
    }
    
    throw error;
  }
};

export default app;
