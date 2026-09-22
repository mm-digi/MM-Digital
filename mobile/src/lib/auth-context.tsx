import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { storage } from "./storage";

const TOKEN_KEY = "mm_dashboard_token";
const NAME_KEY = "mm_dashboard_name";

type AuthState = {
  token: string | null;
  name: string | null;
  isLoading: boolean;
  signIn: (token: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [storedToken, storedName] = await Promise.all([
        storage.getItem(TOKEN_KEY),
        storage.getItem(NAME_KEY),
      ]);
      setToken(storedToken);
      setName(storedName);
      setIsLoading(false);
    })();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      token,
      name,
      isLoading,
      async signIn(newToken: string, newName: string) {
        await Promise.all([
          storage.setItem(TOKEN_KEY, newToken),
          storage.setItem(NAME_KEY, newName),
        ]);
        setToken(newToken);
        setName(newName);
      },
      async signOut() {
        await Promise.all([storage.removeItem(TOKEN_KEY), storage.removeItem(NAME_KEY)]);
        setToken(null);
        setName(null);
      },
    }),
    [token, name, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
