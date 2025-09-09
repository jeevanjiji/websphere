import toast from 'react-hot-toast';

// Utility functions for showing toasts with consistent styling
export const showToast = {
  success: (message, options = {}) => {
    return toast.success(message, {
      duration: options.duration || 4000, // Auto-dismiss after 4 seconds
      dismissible: true,
      ...options,
    });
  },
  
  error: (message, options = {}) => {
    return toast.error(message, {
      duration: options.duration || 6000, // Auto-dismiss after 6 seconds for errors (need more time to read)
      dismissible: true,
      ...options,
    });
  },
  
  info: (message, options = {}) => {
    return toast(message, {
      duration: options.duration || 5000, // Auto-dismiss after 5 seconds
      dismissible: true,
      ...options,
    });
  },
  
  loading: (message, options = {}) => {
    return toast.loading(message, {
      duration: options.duration || 10000, // Auto-dismiss after 10 seconds for loading
      dismissible: true,
      ...options,
    });
  },
  
  // Custom toast with specific styling
  custom: (message, type = 'info', options = {}) => {
    const defaultDurations = {
      success: 4000,
      error: 6000,
      info: 5000
    };
    
    const baseOptions = {
      duration: options.duration || defaultDurations[type] || 5000,
      dismissible: true,
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
  },

  // Create a dismissible toast with explicit close button
  dismissible: (message, type = 'info', options = {}) => {
    const toastId = options.id || `toast-${Date.now()}`;
    const defaultDurations = {
      success: 4000,
      error: 6000,
      info: 5000
    };
    
    return toast((t) => (
      <div className="flex items-center justify-between">
        <span>{message}</span>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="ml-3 text-gray-500 hover:text-gray-700 font-bold text-lg transition-colors"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    ), {
      duration: options.duration || defaultDurations[type] || 5000,
      id: toastId,
      ...options,
    });
  }
};

// Export toast object for backward compatibility
export { toast };
export default showToast;
