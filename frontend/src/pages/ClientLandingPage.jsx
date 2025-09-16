import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ClientDashboard from '../components/ClientDashboard';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';

const ClientLandingPage = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // Wait for auth loading to complete before making redirect decisions
    if (loading) return;
    
    // Protect route - only authenticated clients can access
    if (!isAuthenticated || !user || user.role !== 'client') {
      navigate('/login');
      return;
    }
  }, [navigate, user, isAuthenticated, loading]);

  // Show loading while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="client-landing-page bg-gray-50">
      <Navbar key={`navbar-${user?.id || 'anonymous'}-${isAuthenticated}`} />
      <ClientDashboard showForm={showForm} setShowForm={setShowForm} />
      <Footer />
    </div>
  );
};

export default ClientLandingPage;
