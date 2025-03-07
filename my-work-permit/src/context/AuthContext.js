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

  useEffect(() => {
    const savedData = localStorage.getItem('jkkkkcdvyuscgjkyasfgyudcvkidscvjhcytdjftyad7guilllllaycfui');
    const adminData = window.localStorage.getItem('adminAuth');
    
    if (adminData) {
      const adminUser = JSON.parse(adminData)?.user;
      setUser({ ...adminUser, isAdmin: true });
    } else if (savedData) {
      const userData = JSON.parse(savedData)?.user;
      setUser({ ...userData, isAdmin: false });
    }
    setLoading(false);
  }, []);

  const adminLogin = async (email, password) => {
    try {
      const response = await api.adminLogin({ email, password });
       // Store admin auth separately
       window.localStorage.setItem('adminAuth', JSON.stringify(response));
      
       const userData = {
         ...response.user,
         roleId: response.user.roleId || response.user.RoleID,
         isAdmin: true
       };
       setUser(userData);
      
      return { 
        success: true,
        user: userData
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.login({ email, password });

      /// Abednego 20-01-2025
      window.localStorage.setItem("jkkkkcdvyuscgjkyasfgyudcvkidscvjhcytdjftyad7guilllllaycfui", JSON.stringify(response))
      // Set user with role information
      const userData = {
        ...response.user,
        roleId: response.user.roleId || response.user.RoleID,
        isLimitedUser: response.user.roleId === 'RCV' || response.user.RoleID === 'RCV',
        isAdmin: false
      };
      setUser(userData);
      
      // Return both success and user data
      return { 
        success: true,
        user: userData
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    }
  };

  // const logout = async () => {
  //   try {
  //     await api.logout();
  //   } catch (error) {
  //     console.error('Logout error:', error);
  //   } finally {
  //     setUser(null);
  //     localStorage.removeItem('token');
  //   }
  // };

  // Add helper function to get role display name
  const getUserRoleDisplay = () => {
    if (!user?.roleId) return 'User';
    
    const roles = {
      'RCV': 'Permit Receiver',
      'ISS': 'Permit Issuer',
      'HOD': 'Head of Department',
      'ADMIN': 'Administrator'
    };
    return roles[user.roleId] || 'User';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      adminLogin,
      // logout, 
      loading,
      getUserRoleDisplay, // Export the helper function
      isLimitedUser: user?.isLimitedUser,
      isAdmin: user?.isAdmin
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