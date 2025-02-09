import React from 'react';

export const Input = ({ label, value, onChange, type = 'text', placeholder }) => (
  <div className="flex flex-col gap-1">
    {label && (
      <label className="text-sm text-gray-600">{label}</label>
    )}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
  </div>
);

export const Select = ({ label, value, onChange, options = [], placeholder }) => (
  <div className="flex flex-col gap-1">
    {label && (
      <label className="text-sm text-gray-600">{label}</label>
    )}
    <select
      value={value}
      onChange={onChange}
      className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      {placeholder && (
        <option value="" disabled className="cursor-not-allowed bg-gray-500 bg-opacity-30 text-white">
          {placeholder}
        </option>
      )}
      {options.map((option, index) => {
        // Handle both string and object options
        const optionValue = typeof option === 'object' ? option.DepartmentID : option;
        const optionLabel = typeof option === 'object' ? option.DepartmentName : option;

        return (
          <option key={index} value={optionValue}>
            {optionLabel}
          </option>
        );
      })}
    </select>
  </div>
);