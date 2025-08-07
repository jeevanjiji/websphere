import React, { useState, forwardRef } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Input = forwardRef(({ 
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  helperText,
  disabled = false,
  required = false,
  icon,
  iconPosition = 'left',
  size = 'medium',
  fullWidth = true,
  className = '',
  ...props 
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);
  
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;
  
  const baseClasses = 'border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50';
  
  const sizes = {
    small: 'px-3 py-2 text-sm rounded-lg',
    medium: 'px-4 py-3 text-base rounded-lg',
    large: 'px-5 py-4 text-lg rounded-xl',
  };
  
  const states = {
    default: 'border-gray-border text-gray-dark placeholder-gray-light focus:ring-primary focus:border-primary',
    error: 'border-error text-gray-dark placeholder-gray-light focus:ring-error focus:border-error',
    disabled: 'border-gray-border bg-gray-lighter text-gray-light cursor-not-allowed',
  };
  
  const getState = () => {
    if (disabled) return 'disabled';
    if (error) return 'error';
    return 'default';
  };
  
  const inputClasses = `
    ${baseClasses}
    ${sizes[size]}
    ${states[getState()]}
    ${fullWidth ? 'w-full' : ''}
    ${icon ? (iconPosition === 'left' ? 'pl-12' : 'pr-12') : ''}
    ${isPassword ? 'pr-12' : ''}
    ${className}
  `.trim();

  const handleFocus = (e) => {
    setFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setFocused(false);
    onBlur?.(e);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const iconSizes = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6',
  };

  return (
    <div className={`${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-dark mb-2">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className={`absolute inset-y-0 ${iconPosition === 'left' ? 'left-0' : 'right-0'} flex items-center ${iconPosition === 'left' ? 'pl-4' : 'pr-4'} pointer-events-none`}>
            <span className={`${iconSizes[size]} text-gray-light`}>
              {icon}
            </span>
          </div>
        )}
        
        <input
          ref={ref}
          type={inputType}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={inputClasses}
          {...props}
        />
        
        {isPassword && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-4"
            onClick={togglePasswordVisibility}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeSlashIcon className={`${iconSizes[size]} text-gray-light hover:text-gray-medium transition-colors`} />
            ) : (
              <EyeIcon className={`${iconSizes[size]} text-gray-light hover:text-gray-medium transition-colors`} />
            )}
          </button>
        )}
      </div>
      
      {(error || helperText) && (
        <div className="mt-2">
          {error && (
            <p className="text-sm text-error">{error}</p>
          )}
          {helperText && !error && (
            <p className="text-sm text-gray-light">{helperText}</p>
          )}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
