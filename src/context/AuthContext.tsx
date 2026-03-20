import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { User } from '../types';
import { isAfter, subMonths } from 'date-fns';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  hasAccess: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setUser(userDoc.data() as User);
      } else if (auth.currentUser) {
        // Create new user profile
        const newUser: User = {
          uid: auth.currentUser.uid,
          displayName: auth.currentUser.displayName || 'Anonymous Analyst',
          email: auth.currentUser.email || '',
          photoURL: auth.currentUser.photoURL || '',
          isPremium: false,
          role: 'user',
          createdAt: serverTimestamp(),
        };
        await setDoc(doc(db, 'users', uid), newUser);
        setUser(newUser);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setFirebaseUser(currentUser);
      if (currentUser) {
        await fetchUserData(currentUser.uid);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const refreshUser = async () => {
    if (firebaseUser) {
      await fetchUserData(firebaseUser.uid);
    }
  };

  // Check access: Admin, Premium, or posted in the last 3 months
  const checkAccess = () => {
    if (!user) return false;
    if (user.role === 'admin' || user.isPremium) return true;
    
    if (user.lastPostDate) {
      const lastPost = user.lastPostDate.toDate ? user.lastPostDate.toDate() : new Date(user.lastPostDate);
      const threeMonthsAgo = subMonths(new Date(), 3);
      return isAfter(lastPost, threeMonthsAgo);
    }
    
    return false; // No posts yet
  };

  const hasAccess = checkAccess();

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, signIn, signOut, hasAccess, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
