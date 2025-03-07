import React, { useState, useEffect } from 'react';
import logo from './assets/mps_logo-Photoroom.png';
import backgroundImage from './assets/background_1.jpg';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

const AdminSignInPage = () => {
  const navigate = useNavigate();
  const { adminLogin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  useEffect(() => {
    document.title = "Admin Portal - Work Permit System";
    localStorage.removeItem('token');
    localStorage.removeItem('jkkkkcdvyuscgjkyasfgyudcvkidscvjhcytdjftyad7guilllllaycfui');
    return () => {};
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await adminLogin(formData.email, formData.password);
      if (result.success) {
        if (formData.rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }
        navigate('/admin/user-management');
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError(error.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="w-1/3 flex items-center justify-center p-12 bg-white">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-6">
            <img src={logo} alt="MPS Logo" className="h-24 w-32 object-contain" />
            <h2 className="text-2xl font-semibold mb-6 text-center">Administrator Sign In</h2>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin@mps-gh.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
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
                  Remember me
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-900 text-white py-2 rounded-md hover:bg-blue-800 transition-colors"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>

            <div className="text-sm text-center">
              <a href="/sign-in" className="font-medium text-blue-600 hover:text-blue-500 transition-colors underline">
                Back to User Login
              </a>
            </div>
          </form>
        </div>
      </div>

      {/* Right Side - Background Image */}
      <div 
  className="w-2/3 bg-cover bg-center relative"
  style={{
    backgroundImage: `url(${backgroundImage})`,
  }}
>
  <div className="absolute inset-0 bg-blue-900 opacity-70"></div>
  <div className="absolute inset-0 flex flex-col justify-center items-center text-white text-center p-12">
    {/* Use negative margin-top to adjust the vertical position */}
    <div className="mt-[-200px]">
      <h2 className="text-5xl font-bold mb-4">Work Permit System</h2>
      <p className="text-xl mt-4 mb-8">Administer User Roles and Access Control Efficiently</p>
    </div>
  </div>
</div>
</div>
  );
};

export default AdminSignInPage;