'use client';

import { useState, useEffect } from 'react';
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { saveUserProfile } from '@/lib/firestore-db';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          await saveUserProfile({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
          });
        } catch (err) {
          console.error('Failed to sync user profile to Firestore:', err);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await saveUserProfile({
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
        });
      }
      return result.user;
    } catch (error: unknown) {
      console.error('Google Sign In Error:', error);
      const msg = error instanceof Error ? error.message : 'Authentication failed';
      setAuthError(msg);
      throw error;
    }
  };

  const signOut = async () => {
    setAuthError(null);
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error: unknown) {
      console.error('Sign Out Error:', error);
      const msg = error instanceof Error ? error.message : 'Sign out failed';
      setAuthError(msg);
    }
  };

  return {
    user,
    loading,
    authError,
    signInWithGoogle,
    signOut,
  };
}
