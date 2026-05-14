import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => sessionStorage.getItem('auction_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.getMe(token)
        .then(u => setUser(u))
        .catch(() => { setToken(null); sessionStorage.removeItem('auction_token'); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    setToken(data.token);
    setUser(data.user);
    sessionStorage.setItem('auction_token', data.token);
  };

  const register = async (username, email, password, role) => {
    const data = await api.register({ username, email, password, role });
    setToken(data.token);
    setUser(data.user);
    sessionStorage.setItem('auction_token', data.token);
  };

  const verify = async (otp) => {
    await api.verifyOtp({ otp }, token);
    const updatedUser = { ...user, is_verified: 1 };
    setUser(updatedUser);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('auction_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, verify, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
