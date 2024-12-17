import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './button'; // Adjust import path as needed

export const Dialog = ({ 
  isOpen, 
  onClose, 
  onSaveDraft,
  title, 
  children, 
  className = '', 
}) => {
  const [isConfirmingClose, setIsConfirmingClose] = useState(false);

  const handleInitiateClose = (e) => {
    e.stopPropagation();
    setIsConfirmingClose(true);
  };

  const handleConfirmClose = () => {
    onClose();
    setIsConfirmingClose(false);
  };

  const handleSaveDraftAndClose = () => {
    onSaveDraft();
    onClose();
    setIsConfirmingClose(false);
  };

  const handleCancelClose = (e) => {
    e.stopPropagation();
    setIsConfirmingClose(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full relative">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none"
          onClick={() => onClose()}
        >
          <X size={24} />
        </button>

        {/* Dialog Content */}
        <div className="my-8 text-center">
          <h2 className="text-xl font-semibold mb-4">{title}</h2>
          {!isConfirmingClose ? (
            children
          ) : (
            // Confirmation Pop-up
            <div className="my-4">
              <p className="mb-4 text-gray-700">Are you sure you want to cancel and exit?</p>
              <div className="flex justify-center space-x-4">
                <Button 
                  variant="primary" 
                  onClick={handleSaveDraftAndClose}
                >
                  Save as Draft and Close
                </Button>
                <Button 
                  variant="success" 
                  onClick={handleConfirmClose}
                >
                  Yes, cancel and exit
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};