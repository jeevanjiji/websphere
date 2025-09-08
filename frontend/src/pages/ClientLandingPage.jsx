import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ClientDashboard from '../components/ClientDashboard';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';

const ClientLandingPage = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Protect route - only clients can access
    if (!user || user.role !== 'client') {
      navigate('/login');
      return;
    }
  }, [navigate]);

  return (
    <div className="client-landing-page bg-gray-50">
      <Navbar key={`navbar-${user?.id || 'anonymous'}-${isAuthenticated}`} />
      <ClientDashboard showForm={showForm} setShowForm={setShowForm} />
      <Footer />
    </div>
  );
};

export default ClientLandingPage;
