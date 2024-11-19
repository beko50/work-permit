import React from 'react';

export const Button = ({ onClick, children, className = '', variant = 'default' }) => {
  const baseStyles = 'px-3 py-2 text-sm rounded transition-colors';
  const variantStyles = {
    default: 'bg-white border hover:bg-gray-50',
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    ghost: 'hover:bg-gray-100'
  };

  return (
    <button 
      onClick={onClick} 
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export const IconButton = ({ icon, onClick, className = '' }) => (
  <button 
    onClick={onClick} 
    className={`p-2 rounded hover:bg-gray-100 ${className}`}
  >
    {icon}
  </button>
);