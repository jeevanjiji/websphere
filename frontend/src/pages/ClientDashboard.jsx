import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '../components/ui';

const ClientDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'client') {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    // For logout confirmation, we can use a simple confirm dialog or just logout directly
    // Since toast doesn't support confirmation dialogs, let's use browser confirm for now
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.clear();
      toast.success('Logged out successfully');
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-bg-secondary">
      <header className="bg-white shadow-sm border-b border-gray-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="heading-3">Client Dashboard</h1>
          <Button onClick={handleLogout} variant="outline" size="medium">
            Logout
          </Button>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="heading-2 mb-4">Welcome to your Client Dashboard!</h2>
        <p className="body-regular">Here you can post projects and manage freelancers.</p>
      </div>
    </div>
  );
};

export default ClientDashboard;
