import React from 'react';

export const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow ${className}`}>{children}</div>
);

export const CardHeader = ({ children, className = '' }) => (
  <div className={`flex justify-between items-center px-6 py-4 border-b ${className}`}>
    {children}
  </div>
);

export const CardContent = ({ children }) => (
  <div className="p-6">{children}</div>
);

export const CardTitle = ({ children }) => (
  <h3 className="text-xl font-semibold text-gray-900">{children}</h3>
);