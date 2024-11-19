import React from 'react';

export const Refresh = ({ onClick }) => (
  <button onClick={onClick} className="px-3 py-2 text-sm border rounded hover:bg-gray-50 flex items-center gap-1">
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 10C2 10 4.5 7.5 7 7.5C9.5 7.5 10.5 9.5 13 9.5C15.5 9.5 17 7.5 22 7.5" />
      <path d="M2 14C2 14 4.5 16.5 7 16.5C9.5 16.5 10.5 14.5 13 14.5C15.5 14.5 17 16.5 22 16.5" />
    </svg>
    Refresh
  </button>
);

export const Withdraw = ({ onClick }) => (
  <button onClick={onClick} className="px-3 py-2 text-sm border rounded text-gray-500 hover:bg-gray-50">
    WITHDRAW
  </button>
);

export const Delete = ({ onClick }) => (
  <button onClick={onClick} className="px-3 py-2 text-sm border rounded text-gray-500 hover:bg-gray-50">
    DELETE
  </button>
);

export const PreventEmail = ({ onClick }) => (
  <button onClick={onClick} className="px-3 py-2 text-sm border rounded text-gray-500 hover:bg-gray-50">
    PREVENTEMAIL
  </button>
);