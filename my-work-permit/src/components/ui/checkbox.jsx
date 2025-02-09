import React from 'react';

const Checkbox = ({ checked, onCheckedChange, disabled, className = '' }) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => !disabled && onCheckedChange?.(e.target.checked)}
      disabled={disabled}
      className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    />
  );
  
  export default Checkbox;