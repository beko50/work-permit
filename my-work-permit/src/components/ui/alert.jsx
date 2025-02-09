import React from 'react';

const Alert = ({ children, variant = "default", className = "" }) => {
  const baseStyles = "relative w-full rounded-lg border p-4 mb-4";
  const variantStyles = {
    default: "bg-white text-gray-900 border-gray-200",
    destructive: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div
      role="alert"
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </div>
  );
};

const AlertDescription = ({ children, className = "" }) => (
  <div className={`text-sm ${className}`}>
    {children}
  </div>
);

export { Alert, AlertDescription };