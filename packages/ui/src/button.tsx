import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  children: React.ReactNode;
}

/**
 * Placeholder Button component.
 * Will be fully implemented in a future step.
 */
export const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, ...props }) => {
  return (
    <button data-variant={variant} {...props}>
      {children}
    </button>
  );
};
