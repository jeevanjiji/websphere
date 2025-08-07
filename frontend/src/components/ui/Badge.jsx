import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const Badge = ({ 
  children, 
  variant = 'default',
  size = 'medium',
  removable = false,
  onRemove,
  className = '',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center font-medium transition-all duration-200';
  
  const variants = {
    default: 'bg-gray-lighter text-gray-dark',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    error: 'bg-error/10 text-error',
    info: 'bg-info/10 text-info',
    outline: 'border border-gray-border text-gray-dark bg-white',
    solid: 'bg-gray-dark text-white',
  };
  
  const sizes = {
    small: 'px-2 py-1 text-xs rounded-md',
    medium: 'px-3 py-1 text-sm rounded-lg',
    large: 'px-4 py-2 text-base rounded-lg',
  };
  
  const badgeClasses = `
    ${baseClasses}
    ${variants[variant]}
    ${sizes[size]}
    ${className}
  `.trim();

  const handleRemove = (e) => {
    e.stopPropagation();
    onRemove?.();
  };

  return (
    <span className={badgeClasses} {...props}>
      {children}
      {removable && (
        <button
          type="button"
          onClick={handleRemove}
          className="ml-2 hover:bg-black/10 rounded-full p-0.5 transition-colors"
        >
          <XMarkIcon className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};

export default Badge;
