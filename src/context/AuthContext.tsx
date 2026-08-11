import { createContext, useContext, useState, type ReactNode } from 'react';

export interface AuthState {
  isLoggedIn: boolean;
  isSponsor: boolean;
  name: string;
  email: string;
  login: (email: string, name: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const login = (em: string, nm: string) => {
    setEmail(em);
    setName(nm);
    setIsLoggedIn(true);
  };

  const logout = () => {
    setEmail('');
    setName('');
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isSponsor: isLoggedIn,
        name,
        email,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Fallback for components used outside provider
    return {
      isLoggedIn: false,
      isSponsor: false,
      name: 'Guest',
      email: '',
      login: () => {},
      logout: () => {},
    };
  }
  return ctx;
}
