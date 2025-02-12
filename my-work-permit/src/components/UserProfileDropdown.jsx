import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Icons } from './ui/icons';
import { useNavigate } from 'react-router-dom';

const UserProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedData = window.localStorage.getItem('jkkkkcdvyuscgjkyasfgyudcvkidscvjhcytdjftyad7guilllllaycfui');
    const parsedData = JSON.parse(savedData);
    setCurrentUser(parsedData?.user);
  }, []);

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
      // Attempt API logout
      await api.logout();
    } catch (error) {
      console.error('API logout failed', error);
    } finally {
      // Always clear storage and redirect, even if API call fails
      window.localStorage.removeItem('jkkkkcdvyuscgjkyasfgyudcvkidscvjhcytdjftyad7guilllllaycfui');
      navigate('/login');
    }
  };

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