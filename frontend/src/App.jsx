import React from 'react';
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

import FreelancerDashboard from './pages/FreelancerDashboard';
import TestPage from './pages/TestPage';
import VerifyEmailNotice from './pages/VerifyEmailNotice';
import EmailVerified from './pages/EmailVerified';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import GoogleAuthProvider from './components/GoogleOAuthProvider';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
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
          <Route path="/freelancer-dashboard" element={<FreelancerDashboard />} />
          <Route path="/freelancer-profile-setup" element={<FreelancerProfileSetup />} />
          <Route path="/verify-email-notice" element={<VerifyEmailNotice />} />
          <Route path="/verify-email" element={<EmailVerified />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          </Routes>
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 6000,
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
                iconTheme: {
                  primary: '#1DBF73',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#FF5A5F',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Router>
      </GoogleAuthProvider>
    </AuthProvider>
  );
}

export default App;
