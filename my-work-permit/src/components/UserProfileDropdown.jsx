import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Icons } from './ui/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Add this import

const UserProfileDropdown = ({ isAdmin }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth(); // Get user from AuthContext

  useEffect(() => {
    // Set current user from either admin storage or regular storage
    if (isAdmin) {
      const adminData = window.localStorage.getItem('adminAuth');
      const parsedData = JSON.parse(adminData);
      setCurrentUser(parsedData?.user);
    } else {
      const savedData = window.localStorage.getItem('jkkkkcdvyuscgjkyasfgyudcvkidscvjhcytdjftyad7guilllllaycfui');
      const parsedData = JSON.parse(savedData);
      setCurrentUser(parsedData?.user);
    }
  }, [isAdmin]);

  // Alternative: Use the user from AuthContext directly
  useEffect(() => {
    if (user) {
      setCurrentUser(user);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getUserRoleDisplay = () => {
    const roleId = currentUser?.roleId?.trim();
    switch(roleId) {
      case 'ADMIN': return 'Administrator';
      case 'RCV': return 'Permit Receiver';
      case 'ISS': return 'Permit Issuer';
      case 'HOD': return 'Head of Department';
      case 'QA': return 'QHSSE Approver';
      default: return 'User';
    }
  };

  const getDepartmentFullName = (departmentCode) => {
    const departmentMap = {
      'OPS': 'Operations',
      'ASM': 'Asset Maintenance',
      'IT': 'IT',
      'QHSSE': 'QHSSE'
    };
    return departmentMap[departmentCode] || departmentCode;
  };

  const getInitials = () => {
    if (!currentUser?.firstName) return 'U';
    return `${currentUser.firstName.charAt(0)}${currentUser.lastName ? currentUser.lastName.charAt(0) : ''}`;
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('API logout failed', error);
    } finally {
      if (isAdmin) {
        window.localStorage.removeItem('adminAuth');
        navigate('/admin/sign-in');
      } else {
        window.localStorage.removeItem('jkkkkcdvyuscgjkyasfgyudcvkidscvjhcytdjftyad7guilllllaycfui');
        navigate('/sign-in');
      }
    }
  };

  // Debug log to check what's happening
  console.log('Current User:', currentUser);
  console.log('Is Admin:', isAdmin);

  if (!currentUser) return null;

  const isInternalUser = currentUser.departmentId;
  const departmentName = isInternalUser ? getDepartmentFullName(currentUser.departmentId) : null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
      >
        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-blue-600 font-medium text-sm">
            {getInitials()}
          </span>
        </div>
        <Icons.ChevronDown 
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
          <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center">
                <span className="text-blue-600 font-medium text-lg">
                  {getInitials()}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-900">
                  {currentUser.firstName} {currentUser.lastName}
                </p>
                <p className="text-l text-gray-800">
                  {getUserRoleDisplay()}
                </p>
                {isInternalUser && departmentName && (
                  <p className="text-sm text-gray-500">
                    {departmentName} Department
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
            >
              <Icons.LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Log Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;