"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import Navbar from "@/src/components/Navbar";
import Footer from "@/src/components/Footer";
import { useAuth } from "@/src/hooks/useAuth";
import type { User } from "@/src/types";

type AuthContextValue = {
  user: User | undefined;
  setUser: Dispatch<SetStateAction<User | undefined>>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<User | undefined>(undefined);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }
  }, []);

  useAuth(user, setUser, setAuthLoading);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <main className="routes-main">
        <Navbar setUser={setUser} />
        {authLoading ? (
          <div className="loading">Loading...</div>
        ) : (
          children
        )}
        <Footer />
      </main>
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuthContext must be used within AuthProvider");
  return context;
}
