// frontend/src/components/PasswordStrengthIndicator.jsx
import React from 'react';
import { getPasswordStrength } from '../utils/validation';

const PasswordStrengthIndicator = ({ password, showDetails = true }) => {
  const strength = getPasswordStrength(password);
  
  if (!password) return null;

  const getStrengthBarColor = () => {
    switch (strength.color) {
      case 'red': return 'bg-red-500';
      case 'yellow': return 'bg-yellow-500';
      case 'blue': return 'bg-blue-500';
      case 'green': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  const getStrengthTextColor = () => {
    switch (strength.color) {
      case 'red': return 'text-red-600';
      case 'yellow': return 'text-yellow-600';
      case 'blue': return 'text-blue-600';
      case 'green': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getPasswordChecks = () => {
    if (!password) return [];

    return [
      {
        label: 'At least 8 characters',
        passed: password.length >= 8
      },
      {
        label: 'Contains uppercase letter',
        passed: /[A-Z]/.test(password)
      },
      {
        label: 'Contains lowercase letter',
        passed: /[a-z]/.test(password)
      },
      {
        label: 'Contains number',
        passed: /\d/.test(password)
      },
      {
        label: 'Contains special character',
        passed: /[!@#$%^&*(),.?":{}|<>]/.test(password)
      }
    ];
  };

  const strengthPercentage = (strength.strength / 4) * 100;

  return (
    <div className="mt-2 space-y-2">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">Password Strength</span>
          <span className={`text-xs font-medium ${getStrengthTextColor()}`}>
            {strength.label}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getStrengthBarColor()}`}
            style={{ width: `${strengthPercentage}%` }}
          />
        </div>
      </div>

      {/* Password Requirements */}
      {showDetails && (
        <div className="space-y-1">
          <p className="text-xs text-gray-600">Password must contain:</p>
          <div className="grid grid-cols-1 gap-1">
            {getPasswordChecks().map((check, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                  check.passed ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {check.passed ? (
                    <svg className="w-2 h-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <div className="w-1 h-1 bg-gray-400 rounded-full" />
                  )}
                </div>
                <span className={`text-xs ${
                  check.passed ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {check.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
