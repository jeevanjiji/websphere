import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import FreelancerHero from '../components/FreelancerHero';
import FreelancerDashboard from '../components/FreelancerDashboard';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';

const FreelancerLandingPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('browse');
  const dashboardRef = useRef(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Protect route - only freelancers can access
    if (!user || user.role !== 'freelancer') {
      navigate('/login');
      return;
    }
  }, [navigate]);

  const handleTabNavigation = (tabId) => {
    setActiveTab(tabId);
    // Smooth scroll to dashboard
    if (dashboardRef.current) {
      dashboardRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className="freelancer-landing-page bg-bg-secondary">
      <Navbar key={`navbar-${user?.id || 'anonymous'}-${isAuthenticated}`} />
      <FreelancerHero onTabNavigation={handleTabNavigation} />
      <div ref={dashboardRef}>
        <FreelancerDashboard 
          externalActiveTab={activeTab} 
          onTabChange={setActiveTab} 
        />
      </div>
      <Footer />
    </div>
  );
};

export default FreelancerLandingPage;
