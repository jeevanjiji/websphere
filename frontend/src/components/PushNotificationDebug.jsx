import React, { useState, useEffect } from 'react';
import pushNotificationService from '../services/pushNotificationService';

const PushNotificationDebug = () => {
  const [debugInfo, setDebugInfo] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const runDiagnostics = async () => {
    setIsLoading(true);
    const info = {};

    try {
      // Check basic support
      info.isSupported = pushNotificationService.isSupported();
      info.permissionStatus = pushNotificationService.getPermissionStatus();
      info.isBlocked = pushNotificationService.isPermissionBlocked();

      // Check service worker
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          info.serviceWorkerRegistrations = registrations.length;
          
          const registration = await navigator.serviceWorker.getRegistration();
          info.hasRegistration = !!registration;
          
          if (registration) {
            info.swState = registration.active?.state || 'unknown';
            
            // Check push manager
            if (registration.pushManager) {
              try {
                const subscription = await registration.pushManager.getSubscription();
                info.hasExistingSubscription = !!subscription;
              } catch (err) {
                info.subscriptionError = err.message;
              }
            } else {
              info.pushManagerAvailable = false;
            }
          }
        } catch (err) {
          info.serviceWorkerError = err.message;
        }
      }

      // Check VAPID key
      try {
        const response = await fetch('http://localhost:5000/api/notifications/vapid-public-key');
        const data = await response.json();
        info.vapidKeyAvailable = !!data.publicKey;
        info.vapidKeyLength = data.publicKey?.length;
      } catch (err) {
        info.vapidError = err.message;
      }

      // Check browser info
      info.userAgent = navigator.userAgent;
      info.isSecureContext = window.isSecureContext;
      info.protocol = window.location.protocol;

    } catch (error) {
      info.generalError = error.message;
    }

    setDebugInfo(info);
    setIsLoading(false);
  };

  const testSubscription = async () => {
    try {
      setIsLoading(true);
      await pushNotificationService.subscribe();
      alert('Subscription successful!');
      await runDiagnostics(); // Refresh info
    } catch (error) {
      alert(`Subscription failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Push Notification Diagnostics</h2>
      
      <div className="mb-4 flex space-x-4">
        <button
          onClick={runDiagnostics}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Running...' : 'Run Diagnostics'}
        </button>
        
        <button
          onClick={testSubscription}
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Test Subscription
        </button>
      </div>

      <div className="space-y-4">
        {Object.entries(debugInfo).map(([key, value]) => (
          <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span className="font-medium text-gray-700">{key}:</span>
            <span className={`font-mono text-sm ${
              typeof value === 'boolean' 
                ? value ? 'text-green-600' : 'text-red-600'
                : 'text-gray-800'
            }`}>
              {typeof value === 'boolean' ? (value ? '✅ Yes' : '❌ No') : String(value)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-bold text-blue-800 mb-2">Common Issues & Solutions:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
          <li><strong>Development Environment:</strong> Push notifications often fail on localhost. Use HTTPS in production.</li>
          <li><strong>Browser Support:</strong> Some browsers block push notifications on non-HTTPS sites.</li>
          <li><strong>Service Worker:</strong> Ensure the service worker is properly registered and active.</li>
          <li><strong>VAPID Keys:</strong> Check that valid VAPID keys are configured on the server.</li>
          <li><strong>Permissions:</strong> Make sure notification permissions are granted.</li>
        </ul>
      </div>
    </div>
  );
};

export default PushNotificationDebug;