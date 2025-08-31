import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import FreelancerHero from '../components/FreelancerHero';
import FreelancerDashboard from '../components/FreelancerDashboard';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';

const FreelancerLandingPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Protect route - only freelancers can access
    if (!user || user.role !== 'freelancer') {
      navigate('/login');
      return;
    }
  }, [navigate]);

  return (
    <div className="freelancer-landing-page bg-bg-secondary">
      <Navbar key={`navbar-${user?.id || 'anonymous'}-${isAuthenticated}`} />
      <FreelancerHero />
      <FreelancerDashboard />
      <Footer />
    </div>
  );
};

export default FreelancerLandingPage;
