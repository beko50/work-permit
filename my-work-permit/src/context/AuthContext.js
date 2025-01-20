import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api'

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.getUserProfile();
      // Ensure the user object includes roleId and other necessary fields
      setUser({
        ...response.user,
        roleId: response.user.roleId || response.user.RoleID, // Handle different case conventions
        isLimitedUser: response.user.roleId === 'RCV' || response.user.RoleID === 'RCV'
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.login({ email, password });

      /// Abednego 20-01-2025
      window.localStorage.setItem("jkkkkcdvyuscgjkyasfgyudcvkidscvjhcytdjftyad7guilllllaycfui", JSON.stringify(response))
      // Set user with role information
      setUser({
        ...response.user,
        roleId: response.user.roleId || response.user.RoleID,
        isLimitedUser: response.user.roleId === 'RCV' || response.user.RoleID === 'RCV'
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('token');
    }
  };

  // Add helper function to get role display name
  const getUserRoleDisplay = () => {
    if (!user?.roleId) return 'User';
    
    const roles = {
      'RCV': 'Permit Receiver',
      'ISS': 'Permit Issuer',
      'HOD': 'Head of Department'
    };
    return roles[user.roleId] || 'User';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading,
      getUserRoleDisplay, // Export the helper function
      isLimitedUser: user?.isLimitedUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};