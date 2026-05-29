import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { BerthType } from "@/types/booking";

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  phone: string;
  preferences?: {
    preferredBerth?: BerthType;
    foodPreference?: 'veg' | 'non-veg';
    frequentRoutes?: string[];
  };
  travelHistory?: any[];
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (
    email: string,
    password: string,
    name: string,
    phone: string
  ) => Promise<{ error?: string }>;
  updatePreferences: (prefs: UserProfile['preferences']) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({ uid: firebaseUser.uid, ...userDoc.data() } as UserProfile);
        } else {
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email || "", name: "", phone: "" });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const register = async (email: string, password: string, name: string, phone: string) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const userData = { name, phone, email, createdAt: new Date().toISOString(), preferences: { preferredBerth: 'lb' as BerthType } };
      await setDoc(doc(db, "users", res.user.uid), userData);
      return {};
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const updatePreferences = async (prefs: UserProfile['preferences']) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, { preferences: prefs });
    setUser(prev => prev ? { ...prev, preferences: prefs } : null);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, updatePreferences, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};