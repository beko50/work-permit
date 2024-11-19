import React from 'react';

export const Button = ({ onClick, children, className }) => (
  <button onClick={onClick} className={`btn ${className}`}>
    {children}
  </button>
);

export const IconButton = ({ icon, onClick, className }) => (
  <button onClick={onClick} className={`icon-btn ${className}`}>
    {icon}
  </button>
);
