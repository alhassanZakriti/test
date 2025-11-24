import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, Auth } from 'firebase/auth';
import { getAnalytics, Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCWha1sbZ1-zbTalGBQXWCvPOtQBmF1Fr8",
  authDomain: "modual-web-app.firebaseapp.com",
  projectId: "modual-web-app",
  storageBucket: "modual-web-app.firebasestorage.app",
  messagingSenderId: "606603016078",
  appId: "1:606603016078:web:89412f34209425b14e96df",
  measurementId: "G-30T415NF98"
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
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    
    // Handle specific errors
    if (error.code === 'auth/popup-blocked') {
      throw new Error('Popup was blocked. Please allow popups for this site.');
    } else if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in cancelled. Please try again.');
    } else if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Another popup is already open.');
    }
    
    throw error;
  }
};

export default app;
