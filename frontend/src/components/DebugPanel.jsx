import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const DebugPanel = () => {
  const [debugInfo, setDebugInfo] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        console.log('🔍 Debug - Token exists:', !!token);
        console.log('🔍 Debug - User data:', user);
        
        if (token) {
          // Test API call
          const response = await fetch('http://localhost:5000/api/profile', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          const profileData = await response.json();
          console.log('🔍 Debug - Profile API response:', profileData);
          
          setDebugInfo({
            hasToken: !!token,
            tokenLength: token ? token.length : 0,
            user: user,
            profileResponse: profileData,
            apiStatus: response.status
          });
        } else {
          setDebugInfo({
            hasToken: false,
            error: 'No token found'
          });
        }
      } catch (error) {
        console.error('🔍 Debug error:', error);
        setDebugInfo({
          hasToken: false,
          error: error.message
        });
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const refreshAuth = async () => {
  toast('Refreshing authentication...', { icon: '🔄' });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg">
        <p>Loading debug info...</p>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg max-w-md z-50">
      <h3 className="font-bold mb-2">🔧 Debug Panel</h3>
      <div className="text-sm space-y-1">
        <p><strong>Has Token:</strong> {debugInfo.hasToken ? '✅' : '❌'}</p>
        {debugInfo.hasToken && (
          <>
            <p><strong>Token Length:</strong> {debugInfo.tokenLength}</p>
            <p><strong>User Role:</strong> {debugInfo.user?.role || 'Not set'}</p>
            <p><strong>User Email:</strong> {debugInfo.user?.email || 'Not set'}</p>
            <p><strong>API Status:</strong> {debugInfo.apiStatus}</p>
            <p><strong>Profile Success:</strong> {debugInfo.profileResponse?.success ? '✅' : '❌'}</p>
          </>
        )}
        {debugInfo.error && (
          <p className="text-red-300"><strong>Error:</strong> {debugInfo.error}</p>
        )}
      </div>
      <button
        onClick={refreshAuth}
        className="mt-2 bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
      >
        Clear Auth & Reload
      </button>
    </div>
  );
};

export default DebugPanel;
