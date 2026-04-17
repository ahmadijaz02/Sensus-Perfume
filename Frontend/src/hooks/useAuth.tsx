import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authAPI, setAuthToken, removeAuthToken, getAuthToken } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Session {
  user: User;
  access_token: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check for existing token and validate
    const token = getAuthToken();
    if (token) {
      authAPI.getCurrentUser()
        .then((userData) => {
          setUser(userData);
          setSession({ user: userData, access_token: token });
          setIsAdmin(userData.role === 'admin');
        })
        .catch(() => {
          removeAuthToken();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const data = await authAPI.login(email, password);
      
      setAuthToken(data.token);
      setUser(data.user);
      setSession({ user: data.user, access_token: data.token });
      setIsAdmin(data.user.role === 'admin');
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const data = await authAPI.register(email, password, name);
      
      setAuthToken(data.token);
      setUser(data.user);
      setSession({ user: data.user, access_token: data.token });
      setIsAdmin(data.user.role === 'admin');
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    removeAuthToken();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
