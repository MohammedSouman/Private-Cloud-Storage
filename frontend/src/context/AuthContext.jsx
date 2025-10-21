// frontend/src/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { deriveKeyFromPassword, exportKey, importKey } from '../services/cryptoService';

const AuthContext = createContext(null);

// Constants for storage keys
const TOKEN_KEY = 'token';
const ENCRYPTION_KEY = 'encryption_key';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY));
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [loading, setLoading] = useState(true);

  // This effect runs on app load to restore the session
  useEffect(() => {
    const loadSession = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedKeyB64 = sessionStorage.getItem(ENCRYPTION_KEY);

      if (storedToken && storedKeyB64) {
        try {
          // If a token and key exist, import the key back into a CryptoKey object
          const imported = await importKey(storedKeyB64);
          setToken(storedToken);
          setEncryptionKey(imported);
        } catch (error) {
          console.error("Failed to import session key, logging out.", error);
          logout(); // If key is invalid, clear session
        }
      }
      setLoading(false);
    };
    loadSession();
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token } = response.data;

    // 1. Derive the encryption key from password
    const key = await deriveKeyFromPassword(password, email);
    
    // 2. Export the key to a storable string format
    const exportedKeyB64 = await exportKey(key);

    // 3. Store token and key
    localStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(ENCRYPTION_KEY, exportedKeyB64); // Store key in sessionStorage
    
    // 4. Set state
    setToken(token);
    setEncryptionKey(key);
  };

  const register = async (email, password) => {
    await api.post('/auth/register', { email, password });
    // After registration, automatically log in to establish the session
    await login(email, password);
  };

  const logout = () => {
    // Clear everything from storage and state
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(ENCRYPTION_KEY);
    setToken(null);
    setEncryptionKey(null);
  };

  const value = {
    token,
    encryptionKey,
    login,
    register,
    logout,
    isAuthenticated: !!token && !!encryptionKey, // User is authenticated only if both exist
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};