import React, { createContext, useContext, useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api.js';

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check session on app load
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.SESSION}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success && data.isAuthenticated) {
        setUser(data.user);
        setIsAuthenticated(true);
        // Also update localStorage for backward compatibility
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        // Check if we have a JWT token in localStorage as fallback
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        
        if (token && savedUser) {
          // We have a token, try to use it
          try {
            const userObj = JSON.parse(savedUser);
            setUser(userObj);
            setIsAuthenticated(true);
            console.log('Using stored JWT token and user data');
          } catch (parseError) {
            console.error('Failed to parse stored user data:', parseError);
            setUser(null);
            setIsAuthenticated(false);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }
    } catch (error) {
      console.error('Session check failed:', error);
      // Check for stored JWT token as fallback
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          const userObj = JSON.parse(savedUser);
          setUser(userObj);
          setIsAuthenticated(true);
          console.log('Using stored JWT token after session check failed');
        } catch (parseError) {
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success) {
        // Update state synchronously in the same tick
        const userData = data.user;
        const token = data.token;
        
        // Use flushSync to ensure state updates are applied immediately
        flushSync(() => {
          setUser(userData);
          setIsAuthenticated(true);
        });
        
        if (userData) {
          localStorage.setItem('user', JSON.stringify(userData));
        }
        
        // Store the JWT token for API authentication
        if (token) {
          localStorage.setItem('token', token);
          console.log('JWT token stored successfully');
        }
        
        console.log('Login successful, user state updated:', userData);
        return data;
      }
      return data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGOUT}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      // Clear state regardless of API call success
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
      localStorage.removeItem('token'); // Also remove the JWT token
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.REGISTER}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const googleLogin = async (credential) => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.GOOGLE}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential }),
      });

      const data = await response.json();

      if (data.success) {
        // Update state synchronously in the same tick
        const userData = data.user;
        const token = data.token;
        
        // Use flushSync to ensure state updates are applied immediately
        flushSync(() => {
          setUser(userData);
          setIsAuthenticated(true);
        });
        
        if (userData) {
          localStorage.setItem('user', JSON.stringify(userData));
        }
        
        // Store the JWT token for API authentication
        if (token) {
          localStorage.setItem('token', token);
          console.log('JWT token stored successfully from Google login');
        }
        
        console.log('Google login successful, user state updated:', userData);
        return data;
      }
      return data;
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    register,
    googleLogin,
    checkSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
