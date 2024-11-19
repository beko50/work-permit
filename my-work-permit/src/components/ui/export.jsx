import React from 'react';

export const ExportToExcel = ({ data, filename, children }) => {
  const handleExport = () => {
    // Logic to export `data` to Excel format
    console.log('Exporting data:', data);
  };

  return (
    <button onClick={handleExport} className="export-btn">
      {children}
    </button>
  );
};
