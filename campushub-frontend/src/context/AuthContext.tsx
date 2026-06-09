import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useQuery } from '@apollo/client';
import { ME } from '../lib/queries';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  accountStatus: string;
  profilePictureUrl?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null, token: null, login: () => {}, logout: () => {}, loading: true
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('campushub_token'));

  const { data, loading } = useQuery(ME, { skip: !token, fetchPolicy: 'network-only' });

  useEffect(() => {
    if (data?.me) setUser(data.me);
  }, [data]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('campushub_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('campushub_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
