import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react'; // Modern icon

export const Dropdown = ({ 
  options, 
  value, 
  onChange, 
  className = '', 
  placeholder = 'Select...' 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (selectedOption) => {
    onChange(selectedOption);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left border rounded-lg px-3 py-2 bg-white flex justify-between items-center"
      >
        {value || placeholder}
        <ChevronDown className="h-5 w-5 text-gray-500" />
      </button>
      {isOpen && (
        <ul className="absolute z-10 w-full border rounded-lg mt-1 bg-white shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <li 
              key={option}
              onClick={() => handleSelect(option)}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};