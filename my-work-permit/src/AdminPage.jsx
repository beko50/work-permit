import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from './services/api';
import { toast } from 'react-toastify';
import { useAuth } from './context/AuthContext';
import UserProfileDropdown from './components/UserProfileDropdown';

// Icons component
const Icons = {
  User: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Logout: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  Users: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Edit: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Warning: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8 text-amber-500"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  Success: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8 text-green-500"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Close: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Info: () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5 text-blue-500"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', icon }) => {
  if (!isOpen) return null;

  // Determine button color based on confirmText
  const confirmButtonClass = confirmText === 'Delete' 
    ? "px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md"
    : "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
        <div className="p-6">
          <div className="flex items-start mb-4">
            {icon}
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              <p className="mt-2 text-sm text-gray-500">{message}</p>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-md"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={confirmButtonClass}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Success Notification Card Component
const SuccessCard = ({ message, onClose, actionType }) => {
  useEffect(() => {
    // Auto close the notification after 5 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  // Choose background color based on action type
  let bgColor = 'bg-green-50';
  if (actionType === 'delete') {
    bgColor = 'bg-red-50';
  } else if (actionType === 'activation' || actionType === 'deactivation') {
    bgColor = 'bg-blue-50';
  }

  return (
    <div className={`fixed top-16 right-5 max-w-sm w-full shadow-lg rounded-lg overflow-hidden z-40 ${bgColor} border border-green-200`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icons.Success />
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-gray-900">{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <Icons.Close />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Custom Toggle Switch Component
const ToggleSwitch = ({ isActive, onChange }) => {
  return (
    <div
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer ${
        isActive ? 'bg-green-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          isActive ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </div>
  );
};

// Custom Select Component
const CustomSelect = ({ value, onChange, options, placeholder, id, name }) => {
  return (
    <select
      id={id}
      name={name}
      className="block w-full pl-3 pr-10 py-1 text-sm border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
      value={value || ''}
      onChange={onChange}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

const AddAdminModal = ({ isOpen, onClose, onConfirm, departments }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    departmentId: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);

  // Reset form when modal closes
  const handleClose = (e) => {
    e.stopPropagation();
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      departmentId: '',
    });
    onClose();
  };

  // Handle email input with automatic @mps-gh.com
  const handleEmailChange = (e) => {
    let email = e.target.value;
    // Remove any existing @mps-gh.com or other domain
    email = email.split('@')[0];
    // Set the email with @mps-gh.com
    setFormData({ ...formData, email: `${email}@mps-gh.com` });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate password length
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    // Validate department
    if (!formData.departmentId) {
      toast.error('Department is required');
      return;
    }

    try {
      await onConfirm({
        ...formData,
        email: formData.email.toLowerCase(), // Ensure email is lowercase
        userType: 'Internal',
        isActive: true,
        contractCompanyName: 'MPS Ghana'
      });
      
      // Reset form after successful submission
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        departmentId: '',
      });
    } catch (error) {
      toast.error(error.message || 'Failed to add admin');
    }
  };

  const togglePasswordVisibility = (e) => {
    e.stopPropagation();
    setShowPassword(!showPassword);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
        <form onSubmit={handleSubmit} className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Admin</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  required
                  className="block w-full border border-gray-300 rounded-l-md shadow-sm p-2"
                  value={formData.email.split('@')[0]} // Show only username part
                  onChange={handleEmailChange}
                  placeholder="username"
                />
                <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  @mps-gh.com
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <select
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.DepartmentID} value={dept.DepartmentID}>
                    {dept.DepartmentName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 pr-10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-700 mt-1"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md"
            >
              Add Admin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Helper functions moved outside the component
const isInternalUser = (email) => email.endsWith('@mps-gh.com');

const AdminPage = () => {
  const navigate = useNavigate();
  const { logout, currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [companySearchTerm, setCompanySearchTerm] = useState('');
  const [activeMenu, setActiveMenu] = useState('userManagement');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  // State for confirmation dialogs
  const [confirmationState, setConfirmationState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: null,
    userData: null,
  });

  // State for success notifications
  const [successNotification, setSuccessNotification] = useState({
    show: false,
    message: '',
    actionType: '',
  });

  // State for role and department changes
  const [pendingChanges, setPendingChanges] = useState({
    role: null,
    department: null,
  });

  // Helper function to get available roles based on user type
  const getAvailableRoles = (user) => {
    if (!isInternalUser(user.Email)) {
      return roles.filter(role => role.RoleID === 'RCV');
    }
    // If the user already has ADMIN role, include it in their options
    if (user.RoleID === 'ADMIN') {
      return roles;
    }
    // For other internal users, filter out ADMIN role
    return roles.filter(role => role.RoleID !== 'ADMIN');
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Add this new handler function
const handleAddAdmin = async (adminData) => {
  try {
    await api.addAdmin({
      ...adminData,
      roleId: 'ADMIN',
      isActive: true,
      userType: 'Internal',
      contractCompanyName: 'MPS Ghana'
    });
    
    showSuccessNotification(
      `Admin user ${adminData.firstName} ${adminData.lastName} has been added successfully.`,
      'add'
    );
    setConfirmationState({ ...confirmationState, isOpen: false });
    fetchData(); // Refresh the user list
  } catch (error) {
    console.error('Error adding admin:', error);
    toast.error(error.message || 'Error adding admin user');
  }
};

  const fetchData = async () => {
    try {
      const [usersData, rolesData, departmentsData] = await Promise.all([
        api.getUsers(),
        api.getRoles(),
        api.getDepartments()
      ]);
      console.log('Roles from API:', rolesData); // Debug log
      setUsers(usersData);
      setRoles(rolesData);
      setDepartments(departmentsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  // Function to show success notification
  const showSuccessNotification = (message, actionType) => {
    setSuccessNotification({
      show: true,
      message,
      actionType,
    });
  };

  // Function to close success notification
  const closeSuccessNotification = () => {
    setSuccessNotification({
      show: false,
      message: '',
      actionType: '',
    });
  };

  // Function to show confirmation dialog for role changes
  const confirmRoleChange = (user, newRoleId) => {
    const roleName = roles.find(r => r.RoleID === newRoleId)?.RoleName || newRoleId;
    
    setConfirmationState({
      isOpen: true,
      title: 'Change Role',
      message: `Are you sure you want to change ${user.FirstName} ${user.LastName}'s role to ${roleName}?`,
      onConfirm: () => handleRoleUpdate(user, newRoleId, user.DepartmentID),
      type: 'role',
      userData: user,
    });
    
    // Store the pending change
    setPendingChanges({
      ...pendingChanges,
      role: newRoleId,
    });
  };

  // Function to show confirmation dialog for department changes
  const confirmDepartmentChange = (user, newDepartmentId) => {
    const departmentName = departments.find(d => d.DepartmentID === newDepartmentId)?.DepartmentName || 'No Department';
    
    setConfirmationState({
      isOpen: true,
      title: 'Change Department',
      message: `Are you sure you want to assign ${user.FirstName} ${user.LastName} to the ${departmentName} department?`,
      onConfirm: () => handleRoleUpdate(user, user.RoleID, newDepartmentId),
      type: 'department',
      userData: user,
    });
    
    // Store the pending change
    setPendingChanges({
      ...pendingChanges,
      department: newDepartmentId,
    });
  };

  const handleRoleUpdate = async (user, roleId, departmentId) => {
    try {
      await api.updateUserRole(user.UserID, { roleId, departmentId });
      
      // Determine what changed and show appropriate notification
      if (user.RoleID !== roleId) {
        const newRoleName = roles.find(r => r.RoleID === roleId)?.RoleName || roleId;
        showSuccessNotification(
          `${user.FirstName} ${user.LastName}'s role has been updated to ${newRoleName}.`,
          'role'
        );
      } else if (user.DepartmentID !== departmentId) {
        const newDeptName = departments.find(d => d.DepartmentID === departmentId)?.DepartmentName || 'a new department';
        showSuccessNotification(
          `${user.FirstName} ${user.LastName} has been assigned to ${newDeptName}.`,
          'department'
        );
      }
      
      fetchData(); // Refresh the data
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Error updating user role');
    } finally {
      // Reset pending changes
      setPendingChanges({
        role: null,
        department: null,
      });
    }
  };

  // Function to show confirmation dialog for deleting a user
  const confirmDeleteUser = (user) => {
    setConfirmationState({
      isOpen: true,
      title: 'Delete User',
      message: `Are you sure you want to delete ${user.FirstName} ${user.LastName}? This action cannot be undone.`,
      onConfirm: () => handleDeleteUser(user),
      type: 'delete',
      userData: user,
    });
  };

  const handleDeleteUser = async (user) => {
    try {
      await api.deleteUser(user.UserID);
      showSuccessNotification(
        `${user.FirstName} ${user.LastName} has been deleted successfully.`,
        'delete'
      );
      fetchData(); // Refresh the data
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Error deleting user');
    }
  };

  // Function to show confirmation dialog for toggling user activation
  const confirmActivationToggle = (user) => {
    const actionType = user.IsActive ? 'deactivate' : 'activate';
    
    setConfirmationState({
      isOpen: true,
      title: `${user.IsActive ? 'Deactivate' : 'Activate'} User`,
      message: `Are you sure you want to ${actionType} ${user.FirstName} ${user.LastName}?`,
      onConfirm: () => handleActivationToggle(user),
      type: 'activation',
      userData: user,
    });
  };

  const handleActivationToggle = async (user) => {
    try {
      await api.updateUserActivation(user.UserID, !user.IsActive);
      
      // Show appropriate activation/deactivation message
      if (user.IsActive) {
        showSuccessNotification(
          `${user.FirstName} ${user.LastName} has been deactivated.`,
          'deactivation'
        );
      } else {
        showSuccessNotification(
          `${user.FirstName} ${user.LastName} has been activated.`,
          'activation'
        );
      }
      
      fetchData(); // Refresh the data
    } catch (error) {
      console.error('Error toggling user activation:', error);
      toast.error('Error updating user status');
    }
  };

  // Close the confirmation modal
  const closeConfirmationModal = () => {
    setConfirmationState(prev => ({
      ...prev,
      isOpen: false
    }));
    
    // Reset pending changes if needed
    if (confirmationState.type === 'role' || confirmationState.type === 'department') {
      setPendingChanges({
        role: null,
        department: null,
      });
    }
  };

  const filteredUsers = users.filter(user => 
    (user.FirstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.LastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.Email.toLowerCase().includes(searchTerm.toLowerCase())) &&
    ((user.ContractCompanyName || '').toLowerCase().includes(companySearchTerm.toLowerCase()) ||
     (isInternalUser(user.Email) && 'MPS Ghana'.toLowerCase().includes(companySearchTerm.toLowerCase())))
  );

  // Get current page users
  const indexOfLastUser = currentPage * rowsPerPage;
  const indexOfFirstUser = indexOfLastUser - rowsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  
  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Calculate total pages
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Add Header */}
      <header className="bg-white shadow-sm border-b fixed w-full z-20 h-20">
  <div className="flex flex-col items-center justify-center px-4 py-2">
    <div className="text-lg font-semibold text-gray-800">MPS Work Permit System</div>
    <div className="text-base text-gray-600">Admin Dashboard</div>
  </div>
  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
    <UserProfileDropdown isAdmin={true}/>
  </div>
</header>

{/* Adjust main content to account for fixed header */}
<div className="pt-16">
  <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">

        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search users..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset to first page on search
                  }}
                />
              </div>
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                    <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search company..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full"
                  value={companySearchTerm}
                  onChange={(e) => {
                    setCompanySearchTerm(e.target.value);
                    setCurrentPage(1); // Reset to first page on search
                  }}
                />
              </div>
            </div>
            <button 
              onClick={() => setConfirmationState({
                isOpen: true,
                title: 'Add New Admin',
                message: 'Please enter the details for the new admin user.',
                type: 'addAdmin',
                onConfirm: handleAddAdmin,
              })}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center space-x-2 w-full sm:w-auto justify-center"
            >
              <span>Add Admin</span>
            </button>
          </div>
          
          <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Info</th>
                    <th scope="col" className="px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th scope="col" className="px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Contract Company</th>
                    <th scope="col" className="px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th scope="col" className="px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Department</th>
                    <th scope="col" className="px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentUsers.map((user) => {
                    const internal = isInternalUser(user.Email);
                    const isAdmin = user.RoleID === 'ADMIN';
                    const availableRoles = getAvailableRoles(user).map(role => ({
                      value: role.RoleID,
                      label: role.RoleName
                    }));
                    const departmentOptions = departments.map(dept => ({
                      value: dept.DepartmentID,
                      label: dept.DepartmentName
                    }));

                    // Get the current selected value (actual or pending)
                    const selectedRoleValue = confirmationState.userData?.UserID === user.UserID && 
                                            confirmationState.type === 'role' && 
                                            pendingChanges.role ? 
                                            pendingChanges.role : user.RoleID;

                    const selectedDeptValue = confirmationState.userData?.UserID === user.UserID && 
                                             confirmationState.type === 'department' && 
                                             pendingChanges.department ? 
                                             pendingChanges.department : user.DepartmentID;

                    return (
                      <tr key={user.UserID} className="hover:bg-gray-50">
                        {/* Info column with hover tooltip */}
                        <td className="px-2 sm:px-4 py-4 whitespace-nowrap">
                          <div className="group relative">
                            <button className="text-blue-500 hover:text-blue-700 transition-colors duration-200">
                              <Icons.Info />
                            </button>
                            <div className="absolute left-0 mt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 bg-white shadow-lg rounded-md p-3 z-10 border border-gray-200">
                            <div className="text-xs space-y-2">
                               <p>
                                 <span className="font-semibold">Created:</span>{" "}
                                 {user.Created
                                   ? new Date(user.Created).toLocaleDateString('en-GB', {
                                       day: '2-digit',
                                       month: '2-digit',
                                       year: 'numeric',
                                       hour: '2-digit',
                                       minute: '2-digit',
                                       hour12: true
                                     })
                                   : 'Not available'}
                               </p>
                               <p>
                                 <span className="font-semibold">Last changed:</span>{" "}
                                 {user.Changed
                                   ? new Date(user.Changed).toLocaleDateString('en-GB', {
                                       day: '2-digit',
                                       month: '2-digit',
                                       year: 'numeric',
                                       hour: '2-digit',
                                       minute: '2-digit',
                                       hour12: true
                                     })
                                   : 'No changes'}
                               </p>
                               <p>
                                 <span className="font-semibold">Changed by:</span>{" "}
                                 {user.ChangerName || 'Not available'}
                               </p>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.FirstName} {user.LastName}</div>
                              <div className="text-xs sm:text-sm text-gray-500 truncate max-w-xs">{user.Email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            user.IsActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.IsActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 py-4 whitespace-nowrap hidden md:table-cell">
                          <div className="text-sm text-gray-900">
                            {internal ? 'MPS Ghana' : user.ContractCompanyName || 'External Company'}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-4 whitespace-nowrap">
                          {internal ? (
                            isAdmin ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                Administrator
                              </span>
                            ) : (
                              <CustomSelect
                                value={selectedRoleValue}
                                onChange={(e) => confirmRoleChange(user, e.target.value)}
                                options={availableRoles}
                                id={`role-select-${user.UserID}`}
                                name="role"
                                className="text-xs sm:text-sm"
                              />
                            )
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                              Permit Receiver
                            </span>
                          )}
                        </td>
                        <td className="px-2 sm:px-4 py-4 whitespace-nowrap hidden lg:table-cell">
                          {internal ? (
                            <CustomSelect
                              value={selectedDeptValue}
                              onChange={(e) => confirmDepartmentChange(user, e.target.value)}
                              options={departmentOptions}
                              placeholder="Select Dept"
                              id={`dept-select-${user.UserID}`}
                              name="department"
                              className="text-xs sm:text-sm"
                            />
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-2 sm:px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center justify-end space-x-2 sm:space-x-4">
                            <div className="w-12 flex justify-center">
                              {user.RoleID !== 'ADMIN' && (
                                <button 
                                  onClick={() => confirmActivationToggle(user)}
                                  className="focus:outline-none"
                                  title={user.IsActive ? 'Deactivate' : 'Activate'}
                                >
                                  <ToggleSwitch isActive={user.IsActive} onChange={() => {}} />
                                </button>
                              )}
                            </div>
                            {/*<button
                              onClick={() => confirmDeleteUser(user)}
                              className="text-red-600 hover:text-red-900 transition-colors duration-200 flex items-center"
                              title="Delete"
                              disabled={user.RoleID === 'ADMIN'}
                            >
                              <Icons.Trash />
                            </button> */}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          
          {filteredUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria.</p>
            </div>
          )}
          
          {/* Pagination */}
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <div className="text-sm text-gray-700 mb-4 sm:mb-0">
                Showing <span className="font-medium">{indexOfFirstUser + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(indexOfLastUser, filteredUsers.length)}
                </span>{" "}
                of <span className="font-medium">{filteredUsers.length}</span> users
              </div>
              
              <div className="flex items-center">
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* Dynamic page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
                    // Show pages around the current page
                    let pageNumber;
                    if (totalPages <= 5) {
                      // If total pages <= 5, show all pages
                      pageNumber = index + 1;
                    } else if (currentPage <= 3) {
                      // If we're at the beginning, show pages 1-5
                      pageNumber = index + 1;
                    } else if (currentPage >= totalPages - 2) {
                      // If we're at the end, show last 5 pages
                      pageNumber = totalPages - 4 + index;
                    } else {
                      // Otherwise show 2 pages before and 2 pages after current
                      pageNumber = currentPage - 2 + index;
                    }
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => paginate(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === pageNumber
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === totalPages || totalPages === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationModal
        isOpen={confirmationState.isOpen}
        onClose={closeConfirmationModal}
        onConfirm={confirmationState.onConfirm}
        title={confirmationState.title}
        message={confirmationState.message}
        confirmText={confirmationState.type === 'delete' ? 'Delete' : 'Confirm'}
        cancelText="Cancel"
        icon={<Icons.Warning />}
      />

      {/* Success Notification */}
      {successNotification.show && (
        <SuccessCard
          message={successNotification.message}
          onClose={closeSuccessNotification}
          actionType={successNotification.actionType}
        />
      )}

          <AddAdminModal
            isOpen={confirmationState.type === 'addAdmin'}
            onClose={() => {
              // Just set the state to close the modal, nothing else
              setConfirmationState({ 
                ...confirmationState, 
                isOpen: false,
                type: null  // Clear the type as well
              });
            }}
            onConfirm={handleAddAdmin}
            departments={departments}
          />
    </div>
  </div>
  );
};

export default AdminPage;