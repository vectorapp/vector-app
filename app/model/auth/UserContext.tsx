"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "../data/access/firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../data/access/firebase";
import { User } from "../types";

type UserContextType = {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
};

const UserContext = createContext<UserContextType>({ user: null, firebaseUser: null, loading: true });

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        // Fetch user bio data from Firestore
        try {
          const userDoc = doc(db, "users", firebaseUser.uid);
          const userSnap = await getDoc(userDoc);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || "",
              firstName: userData.firstName || "",
              lastName: userData.lastName || "",
              gender: userData.gender || undefined,
              birthday: userData.birthday || undefined,
              createdAt: userData.createdAt || new Date(),
            });
          } else {
            // User exists in Firebase Auth but not in Firestore
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || "",
              firstName: "",
              lastName: "",
              createdAt: new Date(),
            });
          }
        } catch (error) {
          console.error("Error fetching user bio:", error);
          // Fallback to basic user data
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || "",
            firstName: "",
            lastName: "",
            createdAt: new Date(),
          });
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, firebaseUser, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
} 