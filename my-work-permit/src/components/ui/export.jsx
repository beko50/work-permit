import React from 'react';

export const ExportToExcel = ({ data, filename, children }) => (
  <button 
    onClick={() => console.log('Exporting data:', data)} 
    className="px-3 py-2 text-sm border rounded hover:bg-gray-50 flex items-center gap-1 ml-auto"
  >
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
    {children}
  </button>
);