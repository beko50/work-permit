import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Icons } from './ui/icons';
import { useNavigate } from 'react-router-dom';

const UserProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await api.getUserProfile();
        setUserProfile(profile);
      } catch (error) {
        console.error('Failed to fetch user profile', error);
      }
    };

    fetchUserProfile();
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

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const toggleDropdown = () => setIsOpen(!isOpen);

  if (!userProfile) return null;

  const roleMapping = {
    'RCV': 'Permit Receiver',
    'ISS': 'Permit Issuer',
    'HOD': 'Head of Department',
    'QA': 'Quality Assurance'
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={toggleDropdown} 
        className="p-2 hover:bg-gray-100 rounded-md focus:outline-none"
      >
        <Icons.User className="w-5 h-5 text-gray-600" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="bg-blue-50 p-4 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-full bg-blue-100">
                <Icons.User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-800">
                  {userProfile.firstName} {userProfile.lastName}
                </div>
                <div className="text-sm text-blue-600">
                  {roleMapping[userProfile.roleId] || 'User'}
                </div>
                <div className="text-xs text-gray-500">
                  {userProfile.departmentName}
                </div>
              </div>
            </div>
          </div>
          <div className="py-1">
          <button 
           onClick={handleLogout}
           className="w-full flex items-center justify-center gap-3 px-4 py-2 text-base text-red-600 hover:bg-gray-100 border-t border-gray-200"
            >
            <Icons.LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
        </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;