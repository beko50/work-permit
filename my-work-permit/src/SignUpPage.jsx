import React, { useState,useEffect } from 'react';
import logo from './assets/mps_logo.jpg';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from './components/ui/card';
import { api } from './services/api'

const SignUpPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(''); 
  const [countdown, setCountdown] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const departments = [
    { id: 'IT', name: 'Information Technology' },
    { id: 'OPS', name: 'Operations' },
    { id: 'ASM', name: 'Asset Maintenance' },
    { id: 'QHSSE', name: 'QHSSE' }
  ];
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contractCompanyName: '',
    password: '',
    confirmPassword: '',
    departmentId: '',
    roleId: 'RCV' // Default to Receiver
  });

  // Handle email change to auto-fill company name
  const handleEmailChange = (email) => {
    if (email.endsWith('@mps-gh.com')) {
      setFormData(prev => ({
        ...prev,
        email: email,
        contractCompanyName: 'MPS Ghana'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        email: email,
        contractCompanyName: '', // Reset if not MPS email
        roleId: 'RCV'  // Reset to Receiver for external users
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'email') {
      handleEmailChange(value);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const SuccessCard = () => (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <Card className="bg-green-100 border-l-4 border-green-500 p-6 shadow-lg max-w-lg mx-auto">
        <CardHeader>
          <div className="flex items-center">
            <svg
              className="fill-current h-8 w-8 text-green-500 mr-4"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            <h3 className="text-green-900 font-bold text-lg">Registration successful!</h3>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-green-700 text-base mt-2">
            Redirecting to Sign In page in {countdown} seconds...
          </p>
        </CardContent>
      </Card>
    </div>
  );

  useEffect(() => {
    let countdownInterval;
    
    if (shouldRedirect && countdown > 0) {
      countdownInterval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (shouldRedirect && countdown === 0) {
      navigate('/');
    }

    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [shouldRedirect, countdown, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Log the data being sent
    console.log('Sending registration data:', {
      ...formData,
      password: '[HIDDEN]',
      confirmPassword: '[HIDDEN]',
    });

    try {
      const data = await api.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        contractCompanyName: formData.contractCompanyName,
        departmentId: formData.departmentId || null,
        roleId: formData.roleId
      });

      console.log('Registration successful:', data);
      setShowSuccessCard(true);
      setShouldRedirect(true); // Trigger the countdown effect
  } catch (err) {
    // Handle specific error messages if they exist
    const errorMessage = err.message || 'Network error or server is not responding';
    setError(errorMessage);
    console.error('Registration error:', err);
  } finally {
    setIsLoading(false);
  }
  };

  const isInternalUser = formData.email.endsWith('@mps-gh.com');

  // Define available roles based on user type
  const getRoleOptions = () => {
    if (isInternalUser) {
      return [
        { id: 'RCV', name: 'Permit Receiver' },
        { id: 'ISS', name: 'Permit Issuer' },
        { id: 'HOD', name: 'Head of Department' }
      ];
    } else {
      return [
        { id: 'RCV', name: 'Permit Receiver' }
      ];
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center">
      {showSuccessCard && <SuccessCard />}
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        {/* Logo Section */}
        <div className="flex justify-center mb-0"> {/* Reduce margin-bottom to mb-4 */}
          <img src={logo} alt="Logo" className="h-[90px] w-[120px]" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Sign Up</h2>
        {/* Add error display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* FirstName input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              id="lastName"
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          {/* Email input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

           {/* Company Name field - readonly for internal users */}
           <div>
            <label htmlFor="contractCompanyName" className="block text-sm font-medium text-gray-700">
              Contract Company Name
            </label>
            <input
              id="contractCompanyName"
              type="text"
              name="contractCompanyName"
              value={formData.contractCompanyName}
              onChange={handleChange}
              readOnly={isInternalUser}
              className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                isInternalUser ? 'bg-gray-100' : ''
              }`}
              required
            />
          </div>

          {/* Role Selection - Modified to show options based on user type */}
          <div>
            <label htmlFor="roleId" className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              id="roleId"
              name="roleId"
              value={formData.roleId}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {getRoleOptions().map(role => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          {/* Department selection - only for internal users */}
          {isInternalUser && (
            <div>
              <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700">
                Department
              </label>
              <select
                id="departmentId"
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Password input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5 4.756 0 8.773-3.162 10.065-7.5a10.523 10.523 0 00-4.293-5.774M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.293 6.293l19.414 19.414M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M9.88 9.88a3 3 0 014.243 4.243"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password input */}
          <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                         strokeLinejoin="round"
                          d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5 4.756 0 8.773-3.162 10.065-7.5a10.523 10.523 0 00-4.293-5.774M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                       />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.293 6.293l19.414 19.414M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M9.88 9.88a3 3 0 014.243 4.243"
                        />
                      </svg>
                    )}
                  </button>
                </div>
            </div>

          {/* Sign up button */}
          <button
            type="submit"
            disabled={isLoading || showSuccessCard}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isLoading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>

        <div className="text-sm text-center mt-5">
          Already have an account?{' '}
          <a href="/" className="font-medium text-blue-600 hover:text-blue-500 underline">
            SIGN IN
          </a>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;