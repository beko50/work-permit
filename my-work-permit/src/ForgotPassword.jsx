import React, { useState, useEffect } from 'react';
import logo from './assets/mps_logo-Photoroom.png';
import backgroundImage from './assets/background_1.jpg';
import { useNavigate } from 'react-router-dom';
import { api } from './services/api';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Update document title when component mounts
  useEffect(() => {
    document.title = "Work Permit System - Forgot Password";
    
    // Clean up function to reset title if needed
    return () => {
      // Optional: Reset title when component unmounts
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });
  
    try {
      await api.forgotPassword(email);
      setMessage({
        type: 'success',
        text: 'If this email exists in our system, you will receive a password reset link.'
      });
      
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An error occurred while processing your request. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-opacity-75"
      style={{
        backgroundImage: `url(${backgroundImage})`,
      }}
    >
      <div className="bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-lg w-full max-w-md transition-all duration-300 hover:shadow-xl">
        {/* Header with centered logo and title */}
        <div className="flex flex-col items-center mb-4">
          {/* Centered logo at the top */}
          <img src={logo} alt="MPS Logo" className="h-24 w-32 object-contain" />
        </div>

        {/* Forgot Password heading */}
        <h2 className="text-2xl font-normal text-blue-900 mb-4 text-left">
          Forgot Password?
        </h2>
        
        <p className="text-gray-600 mb-6">
          Enter the email address linked to your account and you will receive an email containing a token string to reset your password.
        </p>

        {message.text && (
          <div 
            className={`mb-4 p-3 rounded ${
              message.type === 'success' 
                ? 'bg-green-100 border-l-4 border-green-500 text-green-700' 
                : 'bg-red-100 border-l-4 border-red-500 text-red-700'
            }`}
          >
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {message.text}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              E-mail
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 mt-1 block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="your.email@example.com"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 transform hover:-translate-y-1"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Reset Password'
            )}
          </button>

          <div className="text-sm text-center">
            <span>Remember your password? </span>
            <a href="/" className="font-medium text-blue-600 hover:text-blue-500 transition-colors underline">
              SIGN IN
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;