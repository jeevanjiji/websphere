import React from 'react';
import { toast } from 'react-hot-toast';
import { showToast } from '../utils/toast.jsx';
import Button from '../components/ui/Button';

const TestPage = () => {
  const testToasts = () => {
    // Test different toast types
    toast.success('Success toast - click the X to close manually!');
    toast.error('Error toast - click the X to close manually!');
    toast('Info toast - click the X to close manually!');
    toast.loading('Loading toast - click the X to close manually!');
    
    // Test utility functions
    setTimeout(() => {
      showToast.success('Utility success toast - click the X to close manually!');
    }, 1000);
    
    setTimeout(() => {
      showToast.error('Utility error toast - click the X to close manually!');
    }, 2000);
    
    setTimeout(() => {
      showToast.info('Utility info toast - click the X to close manually!');
    }, 3000);
  };

  const testAutoCloseToasts = () => {
    // Test toasts with specific durations
    toast.success('Auto-close success (3s)', { duration: 3000 });
    toast.error('Auto-close error (4s)', { duration: 4000 });
    toast('Auto-close info (2s)', { duration: 2000 });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-8">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Toast Test Page</h1>
        <p className="text-lg text-gray-600 mb-8">Test the new manually closable toast functionality!</p>
        
        <div className="space-y-4">
          <Button 
            onClick={testToasts}
            variant="primary"
            className="w-full"
          >
            Test Manual Close Toasts
          </Button>
          
          <Button 
            onClick={testAutoCloseToasts}
            variant="secondary"
            className="w-full"
          >
            Test Auto-Close Toasts
          </Button>
          
          <Button 
            onClick={() => toast.dismiss()}
            variant="ghost"
            className="w-full"
          >
            Dismiss All Toasts
          </Button>
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          <p>• Manual close toasts stay until you click the X</p>
          <p>• Auto-close toasts disappear after their duration</p>
          <p>• All toasts can be manually closed</p>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
