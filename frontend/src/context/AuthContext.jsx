import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Set base URL for API requests
axios.defaults.baseURL = 'http://localhost:5000';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Set auth header for all downstream requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const { token: userToken, user: userData } = res.data;
      
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
      setToken(userToken);
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      return { success: false, error: errMsg };
    }
  };

  const signup = async (name, email, address, password) => {
    try {
      const res = await axios.post('/api/auth/signup', { name, email, address, password });
      const { token: userToken, user: userData } = res.data;
      
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
      setToken(userToken);
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Signup failed. Please try again.';
      return { success: false, error: errMsg };
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    try {
      const res = await axios.put('/api/auth/change-password', { oldPassword, newPassword });
      return { success: true, message: res.data.message };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to update password.';
      return { success: false, error: errMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, changePassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
