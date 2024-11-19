import React from 'react';

export const Table = ({ children }) => (
  <table className="w-full border-collapse">
    {children}
  </table>
);

export const TableHead = ({ children }) => (
  <thead className="bg-gray-50 border-b">
    {children}
  </thead>
);

export const TableBody = ({ children }) => (
  <tbody className="divide-y">
    {children}
  </tbody>
);

export const TableRow = ({ children, className = '' }) => (
  <tr className={`hover:bg-gray-50 ${className}`}>
    {children}
  </tr>
);

export const TableCell = ({ children, className = '' }) => (
  <td className={`px-4 py-3 text-sm ${className}`}>
    {children}
  </td>
);