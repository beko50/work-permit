import React from 'react';

export const Input = ({ label, value, onChange, type = 'text' }) => (
  <div className="input-group">
    <label>{label}</label>
    <input type={type} value={value} onChange={onChange} />
  </div>
);

export const Select = ({ label, value, onChange, options }) => (
  <div className="select-group">
    <label>{label}</label>
    <select value={value} onChange={onChange}>
      {options.map((option, index) => (
        <option key={index} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);
