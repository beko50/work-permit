import React, { useState } from 'react';

const SignInPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
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
  <div className="flex justify-center mb-6">
    {/* Add logo circles here */}
  </div>

  <h2 className="text-3xl font-semibold text-center text-gray-800 mb-8">
    Sign In
  </h2>

  <form onSubmit={handleSubmit} className="space-y-6">
    {/* Username input */}
    <div>
      <label htmlFor="username" className="block text-sm font-medium text-gray-700">
        User name / CID*
      </label>
      {/* Add username input field */}
      <input
        id="username"
        type="text"
        name="username"
        value={formData.username}
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
            className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {/* Add password visibility toggle icon */}
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
        
      {/* <div className="text-sm">
            <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                Forgot password?
            </a>
        </div> */}
    </div> 

    {/* Sign in button */}
    <button
      type="submit"
      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      Sign In
    </button>
  </form>
</div>
    </div>
  );
};

export default SignInPage;