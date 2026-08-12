import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export interface AuthState {
  isLoggedIn: boolean;
  isSponsor: boolean;
  isAdmin: boolean;
  role: string | null;
  name: string;
  email: string;
  loading: boolean;
  /** Real Supabase email+password sign-in. Resolves with the result. */
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string; role?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/** Look up the app_users role/name for a signed-in email. */
async function fetchProfile(email: string): Promise<{ name: string; role: string | null }> {
  if (!supabase) return { name: email, role: null };
  const { data } = await supabase
    .from('app_users')
    .select('name, role, status')
    .ilike('email', email)
    .maybeSingle();
  if (!data) return { name: email, role: null };
  return { name: data.name ?? email, role: (data.role as string) ?? null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Hydrate from an existing session + subscribe to auth changes (persistence).
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    let active = true;

    const apply = async (sessionEmail: string | null) => {
      if (!active) return;
      if (!sessionEmail) {
        setIsLoggedIn(false); setEmail(''); setName(''); setRole(null);
        setLoading(false);
        return;
      }
      const profile = await fetchProfile(sessionEmail);
      if (!active) return;
      setEmail(sessionEmail);
      setName(profile.name);
      setRole(profile.role);
      setIsLoggedIn(true);
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => apply(data.session?.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      apply(session?.user?.email ?? null);
    });

    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  const login = async (em: string, password: string) => {
    if (!supabase) return { ok: false, error: 'Auth is not configured.' };
    const { data, error } = await supabase.auth.signInWithPassword({ email: em, password });
    if (error || !data.user) return { ok: false, error: error?.message ?? 'Invalid credentials.' };
    const profile = await fetchProfile(data.user.email ?? em);
    setEmail(data.user.email ?? em);
    setName(profile.name);
    setRole(profile.role);
    setIsLoggedIn(true);
    return { ok: true, role: profile.role ?? undefined };
  };

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    setEmail(''); setName(''); setRole(null); setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isSponsor: role === 'Sponsor' || role === 'Admin',
        isAdmin: role === 'Admin',
        role,
        name,
        email,
        loading,
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
      isAdmin: false,
      role: null,
      name: 'Guest',
      email: '',
      loading: false,
      login: async () => ({ ok: false, error: 'No auth provider' }),
      logout: async () => {},
    };
  }
  return ctx;
}
