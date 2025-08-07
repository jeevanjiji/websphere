// frontend/src/components/ValidatedInput.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const ValidatedInput = ({
  type = 'text',
  name,
  value,
  onChange,
  onValidation,
  validator,
  placeholder,
  label,
  required = false,
  className = '',
  showValidation = true,
  debounceMs = 300,
  ...props
}) => {
  const [validationResult, setValidationResult] = useState(null);
  const [isTouched, setIsTouched] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);

  // Debounced validation
  useEffect(() => {
    if (!validator || !isTouched) return;

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      const result = validator(value);
      setValidationResult(result);
      if (onValidation) {
        onValidation(name, result);
      }
    }, debounceMs);

    setDebounceTimer(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [value, validator, isTouched, debounceMs, name, onValidation]);

  const handleChange = (e) => {
    if (!isTouched) setIsTouched(true);
    onChange(e);
  };

  const handleBlur = () => {
    if (!isTouched) setIsTouched(true);
  };

  const getInputClassName = () => {
    let baseClass = `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${className}`;
    
    if (!showValidation || !isTouched || !validationResult) {
      return `${baseClass} border-gray-300 focus:ring-blue-500 focus:border-blue-500`;
    }

    if (validationResult.type === 'error') {
      return `${baseClass} border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50`;
    } else if (validationResult.type === 'warning') {
      return `${baseClass} border-yellow-300 focus:ring-yellow-500 focus:border-yellow-500 bg-yellow-50`;
    } else if (validationResult.type === 'success') {
      return `${baseClass} border-green-300 focus:ring-green-500 focus:border-green-500 bg-green-50`;
    }

    return baseClass;
  };

  const getValidationIcon = () => {
    if (!showValidation || !isTouched || !validationResult) return null;

    if (validationResult.type === 'error') {
      return <ExclamationCircleIcon className="h-5 w-5 text-error" />;
    } else if (validationResult.type === 'warning') {
      return <ExclamationTriangleIcon className="h-5 w-5 text-warning" />;
    } else if (validationResult.type === 'success') {
      return <CheckCircleIcon className="h-5 w-5 text-success" />;
    }

    return null;
  };

  const getValidationMessage = () => {
    if (!showValidation || !isTouched || !validationResult) return null;

    const messageClass = {
      error: 'text-error',
      warning: 'text-warning',
      success: 'text-success'
    }[validationResult.type] || 'text-gray-600';

    return (
      <p className={`text-sm mt-1 flex items-center gap-1 ${messageClass}`}>
        {getValidationIcon()}
        {validationResult.message}
      </p>
    );
  };

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          type={type}
          id={name}
          name={name}
          autoComplete={name === 'email' ? 'email' : name === 'fullName' ? 'name' : 'off'}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={getInputClassName()}
          {...props}
        />
        
        {showValidation && isTouched && validationResult && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {getValidationIcon()}
          </div>
        )}
      </div>
      
      {getValidationMessage()}
    </div>
  );
};

export default ValidatedInput;
