import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData) => {
    try {
      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const signIn = async (email, password) => {
    try {
      // For demo purposes, create a simple user object
      const userData = {
        id: 'user-' + Date.now(),
        email,
        name: email.split('@')[0],
        createdAt: new Date().toISOString(),
      };
      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Error signing in:', error);
      throw new Error('Failed to sign in');
    }
  };

  const signUp = async (userData) => {
    try {
      // For demo purposes, create a simple user object
      const newUser = {
        id: 'user-' + Date.now(),
        email: userData.email,
        name: `${userData.firstName} ${userData.lastName}`,
        phoneNumber: userData.phoneNumber,
        createdAt: new Date().toISOString(),
      };
      setUser(newUser);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      return newUser;
    } catch (error) {
      console.error('Error signing up:', error);
      throw new Error('Failed to create account');
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Error removing user:', error);
    }
  };

  const updateUser = async (updatedUser) => {
    try {
      const newUser = { ...user, ...updatedUser };
      setUser(newUser);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const value = {
    user,
    loading,
    login,
    signIn,
    signUp,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 