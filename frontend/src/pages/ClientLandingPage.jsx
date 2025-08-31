import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ClientHero from '../components/ClientHero';
import ClientDashboard from '../components/ClientDashboard';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';

const ClientLandingPage = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const handlePostProject = () => {
    console.log('Post project clicked from hero'); // Debug log
    setShowForm(true);
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Protect route - only clients can access
    if (!user || user.role !== 'client') {
      navigate('/login');
      return;
    }
  }, [navigate]);

  return (
    <div className="client-landing-page bg-bg-secondary">
      <Navbar key={`navbar-${user?.id || 'anonymous'}-${isAuthenticated}`} />
      <ClientHero onPostProject={handlePostProject} />
      <ClientDashboard showForm={showForm} setShowForm={setShowForm} />
      <Footer />
    </div>
  );
};

export default ClientLandingPage;
