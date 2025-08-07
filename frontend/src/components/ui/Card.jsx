import React from 'react';
import { motion } from 'framer-motion';

const Card = ({ 
  children, 
  variant = 'default',
  padding = 'default',
  hover = true,
  clickable = false,
  onClick,
  className = '',
  ...props 
}) => {
  const baseClasses = 'bg-white border border-gray-border transition-all duration-200';
  
  const variants = {
    default: 'rounded-xl shadow-card',
    compact: 'rounded-lg shadow-sm',
    elevated: 'rounded-xl shadow-lg',
    flat: 'rounded-lg border-0 shadow-none bg-gray-lighter',
  };
  
  const paddings = {
    none: 'p-0',
    small: 'p-4',
    default: 'p-6',
    large: 'p-8',
  };
  
  const hoverClasses = hover ? 'hover:shadow-card-hover hover:-translate-y-1' : '';
  const clickableClasses = clickable ? 'cursor-pointer' : '';
  
  const cardClasses = `
    ${baseClasses}
    ${variants[variant]}
    ${paddings[padding]}
    ${hoverClasses}
    ${clickableClasses}
    ${className}
  `.trim();

  const CardContent = () => (
    <div className={cardClasses} onClick={onClick} {...props}>
      {children}
    </div>
  );

  if (hover || clickable) {
    return (
      <motion.div
        whileHover={hover ? { y: -4, boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)' } : {}}
        whileTap={clickable ? { scale: 0.98 } : {}}
        transition={{ duration: 0.2 }}
      >
        <CardContent />
      </motion.div>
    );
  }

  return <CardContent />;
};

// Card sub-components
Card.Header = ({ children, className = '', ...props }) => (
  <div className={`border-b border-gray-border pb-4 mb-4 ${className}`} {...props}>
    {children}
  </div>
);

Card.Body = ({ children, className = '', ...props }) => (
  <div className={className} {...props}>
    {children}
  </div>
);

Card.Footer = ({ children, className = '', ...props }) => (
  <div className={`border-t border-gray-border pt-4 mt-4 ${className}`} {...props}>
    {children}
  </div>
);

Card.Title = ({ children, className = '', ...props }) => (
  <h3 className={`text-xl font-semibold text-gray-dark ${className}`} {...props}>
    {children}
  </h3>
);

Card.Description = ({ children, className = '', ...props }) => (
  <p className={`text-gray-medium ${className}`} {...props}>
    {children}
  </p>
);

export default Card;
