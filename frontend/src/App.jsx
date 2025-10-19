import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './styles/toast.css';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FreelancerRegistration from './pages/FreelancerRegistration';
import FreelancerRegistrationSimple from './pages/FreelancerRegistrationSimple';
import AdminDashboard from './pages/AdminDashboard';
import LandingPage from './pages/LandingPage';
import ClientLandingPage from './pages/ClientLandingPage';
import FreelancerLandingPage from './pages/FreelancerLandingPage';
import FreelancerProfileSetup from './pages/FreelancerProfileSetup';
import FindWork from './pages/FindWork';
import WhyWebSphere from './pages/WhyWebSphere';

import FreelancerDashboard from './components/FreelancerDashboard';
import ClientDashboard from './components/ClientDashboard';
import TestPage from './pages/TestPage';
import VerifyEmailNotice from './pages/VerifyEmailNotice';
import EmailVerified from './pages/EmailVerified';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import GoogleAuthProvider from './components/GoogleOAuthProvider';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import notificationService from './services/notificationService';

function App() {
  useEffect(() => {
    // Initialize notification service
    const initNotifications = async () => {
      try {
        // Request notification permission
        await notificationService.requestPermission();
        
        // Setup notification handlers
        notificationService.setupNotificationHandlers();
        
        // Setup WebSocket notifications
        notificationService.setupWebSocketNotifications();
        
        console.log('Notification service initialized');
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    // Only initialize if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      initNotifications();
    }
  }, []);
  return (
    <AuthProvider>
      <SocketProvider>
        <GoogleAuthProvider>
          <Router>
          <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/freelancer-registration" element={<FreelancerRegistration />} />
          <Route path="/freelancer-registration-simple" element={<FreelancerRegistrationSimple />} />
          <Route path="/client" element={<ClientLandingPage />} />
          <Route path="/freelancer" element={<FreelancerLandingPage />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/freelancer-profile-setup" element={<FreelancerProfileSetup />} />
          <Route path="/verify-email-notice" element={<VerifyEmailNotice />} />
          <Route path="/verify-email" element={<EmailVerified />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/find-work" element={<FindWork />} />
          <Route path="/why-websphere" element={<WhyWebSphere />} />
          <Route path="/freelancer-dashboard" element={<FreelancerDashboard />} />
          <Route path="/client-dashboard" element={<ClientDashboard />} />
          </Routes>
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 5000, // Auto-dismiss after 5 seconds by default
              dismissible: true, // Enable manual dismissal
              style: {
                background: '#fff',
                color: '#333',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                borderRadius: '8px',
                padding: '16px',
                paddingRight: '40px', // Extra space for close button
                position: 'relative',
              },
              success: {
                duration: 4000, // Success messages auto-dismiss after 4 seconds
                iconTheme: {
                  primary: '#1DBF73',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 6000, // Error messages auto-dismiss after 6 seconds (more time to read)
                iconTheme: {
                  primary: '#FF5A5F',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Router>
      </GoogleAuthProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
