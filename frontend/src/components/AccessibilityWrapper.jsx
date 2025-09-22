// frontend/src/components/AccessibilityWrapper.jsx
import React from 'react';

/**
 * Accessibility wrapper component for better screen reader support
 */
const AccessibilityWrapper = ({ 
  children, 
  role = null, 
  ariaLabel = null, 
  ariaLabelledBy = null,
  ariaDescribedBy = null,
  tabIndex = null,
  onKeyDown = null,
  className = ""
}) => {
  const handleKeyDown = (e) => {
    // Handle Enter key as click for keyboard navigation
    if (e.key === 'Enter' && onKeyDown) {
      onKeyDown(e);
    }
  };

  return (
    <div
      role={role}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      tabIndex={tabIndex}
      onKeyDown={handleKeyDown}
      className={className}
    >
      {children}
    </div>
  );
};

/**
 * Accessible button component with proper ARIA attributes
 */
export const AccessibleButton = ({ 
  children, 
  onClick, 
  disabled = false, 
  variant = 'primary',
  size = 'medium',
  ariaLabel = null,
  ariaPressed = null,
  ariaExpanded = null,
  className = "",
  ...props 
}) => {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-gray-400",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
  };

  const sizeClasses = {
    small: "px-3 py-1.5 text-sm",
    medium: "px-4 py-2 text-base",
    large: "px-6 py-3 text-lg"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      aria-expanded={ariaExpanded}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * Accessible form input with proper labeling
 */
export const AccessibleInput = ({
  label,
  id,
  type = "text",
  required = false,
  error = null,
  helperText = null,
  className = "",
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${inputId}-error` : null;
  const helperId = helperText ? `${inputId}-helper` : null;

  return (
    <div className="space-y-1">
      <label 
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>
      
      <input
        id={inputId}
        type={type}
        required={required}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={[errorId, helperId].filter(Boolean).join(' ') || undefined}
        className={`
          block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
          focus:outline-none focus:ring-blue-500 focus:border-blue-500
          ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      
      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      
      {helperText && (
        <p id={helperId} className="text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
};

/**
 * Skip navigation link for keyboard users
 */
export const SkipNavigation = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
    >
      Skip to main content
    </a>
  );
};

/**
 * Screen reader only text component
 */
export const ScreenReaderOnly = ({ children }) => {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
};

/**
 * Loading spinner with accessibility support
 */
export const AccessibleLoadingSpinner = ({ size = 'medium', label = 'Loading...' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  };

  return (
    <div role="status" aria-label={label}>
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-200 border-t-blue-600`}></div>
      <ScreenReaderOnly>{label}</ScreenReaderOnly>
    </div>
  );
};

export default AccessibilityWrapper;