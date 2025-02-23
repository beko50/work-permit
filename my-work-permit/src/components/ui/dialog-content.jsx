import React from 'react';
import { X } from 'lucide-react';

export const Dialog = ({ 
  children, 
  open, 
  onOpenChange 
}) => {
  if (!open) return null;
  
  return children;
};

export const DialogContent = ({ 
  children, 
  className = '',
  onOpenChange
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl relative ${className}`}>
        {children}
      </div>
    </div>
  );
};

export const DialogHeader = ({
  className = '',
  children
}) => {
  return (
    <div className={`p-6 pb-2 ${className}`}>
      {children}
    </div>
  );
};

export const DialogTitle = ({
  className = '',
  children
}) => {
  return (
    <div className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
      {children}
    </div>
  );
};

// Export all components
export { DialogContent as default };