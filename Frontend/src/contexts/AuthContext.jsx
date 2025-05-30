import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCredentials, logout } from '@/store/slices/authSlice';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector(state => state.auth);
  const navigate = useNavigate();

  const login = (userData, token) => {
    dispatch(setCredentials({ user: userData, token }));
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout: handleLogout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 