// frontend/src/components/GoogleOAuthProvider.jsx
import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const GoogleAuthProvider = ({ children }) => {
  console.log('Google Client ID loaded:', !!GOOGLE_CLIENT_ID); // Debug log
  
  if (!GOOGLE_CLIENT_ID) {
    console.error('Google Client ID is missing. Check your .env file');
    console.error('Expected: VITE_GOOGLE_CLIENT_ID=your_client_id');
    console.error('Found:', GOOGLE_CLIENT_ID);
    
    // Don't render the Google provider if client ID is missing
    return (
      <div style={{ padding: '20px', backgroundColor: '#ffe6e6', border: '1px solid #ff0000', borderRadius: '8px', margin: '20px' }}>
        <h3 style={{ color: '#cc0000' }}>Google OAuth Setup Required</h3>
        <p>Please add your Google Client ID to the .env file:</p>
        <code style={{ backgroundColor: '#f5f5f5', padding: '10px', display: 'block', marginTop: '10px' }}>
          VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
        </code>
        <p style={{ marginTop: '10px' }}>Then restart your development server.</p>
        {children}
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {children}
    </GoogleOAuthProvider>
  );
};

export default GoogleAuthProvider;
