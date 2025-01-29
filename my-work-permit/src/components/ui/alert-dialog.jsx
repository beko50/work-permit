import React from 'react';
import { Button } from './button';

export const AlertDialog = ({ open, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50">
      <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
        {children}
      </div>
    </div>
  );
};

export const AlertDialogContent = ({ children, className = '', ...props }) => (
  <div className={`grid gap-4 ${className}`} {...props}>
    {children}
  </div>
);

export const AlertDialogHeader = ({ children, className = '', ...props }) => (
  <div className={`grid gap-2 ${className}`} {...props}>
    {children}
  </div>
);

export const AlertDialogTitle = ({ children, className = '', ...props }) => (
  <h2 className={`text-lg font-semibold ${className}`} {...props}>
    {children}
  </h2>
);

export const AlertDialogDescription = ({ children, className = '', ...props }) => (
  <div className={`text-sm text-muted-foreground ${className}`} {...props}>
    {children}
  </div>
);

export const AlertDialogFooter = ({ children, className = '', ...props }) => (
  <div className={`flex justify-end gap-2 ${className}`} {...props}>
    {children}
  </div>
);

export const AlertDialogAction = ({ children, className = '', ...props }) => (
  <Button
    variant="default"
    className={`bg-primary text-primary-foreground hover:bg-primary/90 ${className}`}
    {...props}
  >
    {children}
  </Button>
);

export const AlertDialogCancel = ({ children, className = '', ...props }) => (
  <Button
    variant="outline"
    className={`border border-input bg-background hover:bg-accent hover:text-accent-foreground ${className}`}
    {...props}
  >
    {children}
  </Button>
);