import React from 'react';
import { X } from 'lucide-react';

export const DialogContent = ({ 
  children, 
  className = '',
  onOpenChange
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl relative ${className}`}>
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none"
          onClick={() => onOpenChange?.(false)}
        >
          <X size={24} />
        </button>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DialogContent;