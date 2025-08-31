import toast from 'react-hot-toast';

// Utility functions for showing toasts with consistent styling
export const showToast = {
  success: (message, options = {}) => {
    return toast.success(message, {
      duration: 5000,
      ...options,
    });
  },
  
  error: (message, options = {}) => {
    return toast.error(message, {
      duration: 6000,
      ...options,
    });
  },
  
  info: (message, options = {}) => {
    return toast(message, {
      duration: 4000,
      ...options,
    });
  },
  
  loading: (message, options = {}) => {
    return toast.loading(message, {
      ...options,
    });
  },
  
  // Custom toast with specific styling
  custom: (message, type = 'info', options = {}) => {
    const baseOptions = {
      duration: 4000,
      ...options,
    };
    
    switch (type) {
      case 'success':
        return toast.success(message, baseOptions);
      case 'error':
        return toast.error(message, baseOptions);
      default:
        return toast(message, baseOptions);
    }
  },
  
  // Dismiss specific toast
  dismiss: (toastId) => {
    return toast.dismiss(toastId);
  },
  
  // Dismiss all toasts
  dismissAll: () => {
    return toast.dismiss();
  }
};

// Export toast object for backward compatibility
export { toast };
export default showToast;
