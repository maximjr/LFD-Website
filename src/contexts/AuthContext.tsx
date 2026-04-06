import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ currentUser: null, isAdmin: false, loading: true });

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          // 1. Check Custom Claims
          const tokenResult = await getIdTokenResult(user);
          if (tokenResult.claims.admin) {
            setIsAdmin(true);
          } else {
            // 2. Check Firestore Role
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
              setIsAdmin(userDoc.data().role === "admin");
            } else {
              // 3. Default Admin Check
              if (user.email === "Obenmaxjr@gmail.com") {
                await setDoc(userDocRef, {
                  email: user.email,
                  role: "admin",
                  displayName: user.displayName || "Admin"
                });
                setIsAdmin(true);
              } else {
                await setDoc(userDocRef, {
                  email: user.email,
                  role: "user",
                  displayName: user.displayName || "User"
                });
                setIsAdmin(false);
              }
            }
          }
        } catch (err) {
          console.error("Error checking admin status:", err);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    isAdmin,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
