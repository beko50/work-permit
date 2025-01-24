import React from 'react';

export const Button = ({ 
  onClick, 
  children, 
  className = '', 
  variant = 'default',
  type = 'button', // Add default type prop
  disabled = false // Also add disabled prop support
}) => {
  const baseStyles = 'px-3 py-2 text-sm rounded transition-colors';
  const variantStyles = {
    default: 'bg-white border hover:bg-gray-50',
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    ghost: 'hover:bg-gray-100',
    success: 'bg-green-600 text-white hover:bg-green-700',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };

  return (
    <button 
      onClick={onClick}
      type={type} // Forward the type prop
      disabled={disabled} // Forward the disabled prop
      className={`${baseStyles} ${variantStyles[variant]} ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {children}
    </button>
  );
};

export const IconButton = ({ 
  icon, 
  onClick, 
  className = '',
  type = 'button' // Add type prop here too for consistency
}) => (
  <button 
    onClick={onClick}
    type={type} // Forward the type prop
    className={`p-2 rounded hover:bg-gray-100 ${className}`}
  >
    {icon}
  </button>
);