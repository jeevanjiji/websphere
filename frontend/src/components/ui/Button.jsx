import React from 'react';
import { motion } from 'framer-motion';

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon = null,
  iconPosition = 'left',
  fullWidth = false,
  onClick,
  type = 'button',
  as: Component = 'button',
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-accent focus:ring-primary',
    secondary: 'bg-white text-primary border-2 border-primary hover:bg-primary hover:text-white focus:ring-primary',
    outline: 'bg-transparent text-gray-dark border border-gray-border hover:border-primary hover:text-primary focus:ring-primary',
    ghost: 'bg-transparent text-gray-dark hover:bg-gray-lighter focus:ring-primary',
    danger: 'bg-error text-white hover:bg-red-600 focus:ring-error',
    success: 'bg-success text-white hover:bg-green-600 focus:ring-success',
  };
  
  const sizes = {
    small: 'px-4 py-2 text-sm rounded-lg',
    medium: 'px-6 py-3 text-base rounded-lg',
    large: 'px-8 py-4 text-lg rounded-xl',
  };
  
  const iconSizes = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6',
  };
  
  const buttonClasses = `
    ${baseClasses}
    ${variants[variant]}
    ${sizes[size]}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim();

  const LoadingSpinner = () => (
    <svg 
      className={`animate-spin ${iconSizes[size]} ${iconPosition === 'right' ? 'ml-2' : 'mr-2'}`} 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  const renderIcon = () => {
    if (loading) return <LoadingSpinner />;
    if (!icon) return null;
    
    return (
      <span className={`${iconSizes[size]} ${iconPosition === 'right' ? 'ml-2' : 'mr-2'}`}>
        {icon}
      </span>
    );
  };

  const MotionComponent = motion(Component);

  return (
    <MotionComponent
      type={Component === 'button' ? type : undefined}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick}
      whileHover={{ scale: 1 }}
      whileTap={{ scale: 1 }}
      transition={{ duration: 0.1 }}
      {...props}
    >
      {iconPosition === 'left' && renderIcon()}
      {children}
      {iconPosition === 'right' && renderIcon()}
    </MotionComponent>
  );
};

export default Button;
