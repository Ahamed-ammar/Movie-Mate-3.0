import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const response = await authAPI.getMe();
        const userData = response.data.data.user;
        // Backend returns 'id', keep both for compatibility
        setUser({
          ...userData,
          id: userData.id,
          _id: userData.id // Also set _id for compatibility
        });
      }
    } catch (error) {
      localStorage.removeItem('accessToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (loginData) => {
    try {
      // loginData can be { email, password } or { username, password }
      const response = await authAPI.login(loginData);
      const { user: userData, accessToken } = response.data.data;
      
      localStorage.setItem('accessToken', accessToken);
      // Backend returns 'id', keep both for compatibility
      setUser({
        ...userData,
        id: userData.id,
        _id: userData.id // Also set _id for compatibility
      });
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await authAPI.register({ username, email, password });
      const { user: userData, accessToken } = response.data.data;
      
      localStorage.setItem('accessToken', accessToken);
      // Backend returns 'id', keep both for compatibility
      setUser({
        ...userData,
        id: userData.id,
        _id: userData.id // Also set _id for compatibility
      });
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed'
      };
    }
  };

  const googleLogin = async (idToken) => {
    try {
      const response = await authAPI.googleLogin(idToken);
      const { user: userData, accessToken } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      setUser({
        ...userData,
        id: userData.id,
        _id: userData.id
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Google login failed'
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    googleLogin,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
