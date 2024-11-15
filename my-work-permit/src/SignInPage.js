import React, { useState } from 'react';
import logo from './assets/mps_logo.jpg';

const SignInPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle sign-in logic here
    console.log('Form submitted:', formData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        {/* Logo Section */}
        <div className="flex justify-center mb-0"> {/* Reduce margin-bottom to mb-4 */}
          <img src={logo} alt="Logo" className="h-[90px] w-[120px]" />
        </div>

      <h2 className="text-2xl font-semibold text-gray-800 mb-5"> {/* Reduce margin-bottom to mb-4 */}
          Sign In
      </h2>

  <form onSubmit={handleSubmit} className="space-y-6">
    {/* Email input */}
    <div>
      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
        Email
      </label>
      {/* Add email input field */}
      <input
        id="email"
        type="text"
        name="email"
        value={formData.email}
        onChange={handleChange}
        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        required
        />
    </div>

    {/* Password input */}
    <div>
      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
        Password*
      </label>
      {/* Add password input field */}
      <div className="relative">
        <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required/>
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

    {/* Remember me and forgot password */}
    <div className="flex items-center justify-between">
      {/* Add remember me checkbox */}
      {/* Add forgot password link */} 
      <div className="flex items-center">
        <input
            type="checkbox"
            id="remember"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
            Remember me?
        </label>
      </div>
        
       <div className="text-sm">
            <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                Forgot password?
            </a>
        </div> 
    </div> 

    {/* Sign in button */}
    <button
      type="submit"
      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      Sign In
    </button>
    <div className="text-sm text-center">
      <span>New User? </span>
      <a href="#" className="font-medium text-blue-600 hover:text-blue-500 underline">
        SIGN UP
      </a>
    </div>
  </form>
</div>
    </div>
  );
};

export default SignInPage;