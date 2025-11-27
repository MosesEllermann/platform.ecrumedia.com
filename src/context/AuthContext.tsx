import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ClientProfile {
  id: string;
  clientNumber: number;
  type: 'COMPANY' | 'PRIVATE';
  name: string;
  vatNumber: string | null;
  homepage: string | null;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  company: string | null;
  vatNumber: string | null;
  homepage: string | null;
  phone: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  country: string;
  profileImage: string | null;
  isActive: boolean;
  client: ClientProfile | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // Check for loginToken in URL (for "Als Kunde anmelden" functionality)
      const urlParams = new URLSearchParams(window.location.search);
      const loginToken = urlParams.get('loginToken');

      if (loginToken) {
        try {
          // Decode and store the token
          const decodedToken = decodeURIComponent(loginToken);
          
          // Fetch user data with this token
          const response = await fetch('http://localhost:3000/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${decodedToken}`,
            },
          });

          if (!response.ok) {
            throw new Error('Invalid token');
          }

          const userData = await response.json();
          
          // Store credentials
          localStorage.setItem('accessToken', decodedToken);
          localStorage.setItem('user', JSON.stringify(userData));
          setToken(decodedToken);
          setUser(userData);
          
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (err) {
          console.error('Failed to authenticate with login token:', err);
          // Clean up URL even on error
          window.history.replaceState({}, document.title, window.location.pathname);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // Check if user is logged in on mount (normal flow)
      const storedToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('accessToken', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    try {
      // Call logout API
      await fetch('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and state
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      // Redirect to login page
      window.location.href = '/signin';
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('http://localhost:3000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        refreshUser,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'ADMIN',
        isLoading,
      }}
    >
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
