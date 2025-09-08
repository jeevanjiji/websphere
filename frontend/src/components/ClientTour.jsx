import React, { useState, useEffect } from 'react';
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

const ClientTour = ({ runTour, onTourEnd }) => {
  const [runJoyride, setRunJoyride] = useState(false);

  useEffect(() => {
    if (runTour) {
      setRunJoyride(true);
    }
  }, [runTour]);

  const steps = [
    {
      target: '.client-dashboard-welcome',
      content: (
        <div className="p-2">
          <h3 className="text-lg font-semibold mb-2">Welcome to WebSphere! 👋</h3>
          <p className="text-sm text-gray-600 mb-3">
            This is your dashboard where you can manage all your projects and find talented freelancers.
          </p>
          <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
            💡 <strong>Tip:</strong> You can restart this tour anytime by clicking "Reload Tour" in the top navigation bar.
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.post-project-btn',
      content: (
        <div className="p-2">
          <h3 className="text-lg font-semibold mb-2">Post a New Project 📝</h3>
          <p className="text-sm text-gray-600">
            Click here to post a new project. Describe what you need help with, and freelancers will apply to work with you.
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.dashboard-tabs',
      content: (
        <div className="p-2">
          <h3 className="text-lg font-semibold mb-2">Navigate Your Projects 📋</h3>
          <p className="text-sm text-gray-600">
            • <strong>My Projects:</strong> See all your posted projects<br/>
            • <strong>Applications:</strong> Review freelancer proposals<br/>
            • <strong>Messages:</strong> Chat with freelancers
          </p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.project-cards',
      content: (
        <div className="p-2">
          <h3 className="text-lg font-semibold mb-2">Your Project Cards 💼</h3>
          <p className="text-sm text-gray-600">
            Each card shows your project details, budget, and how many freelancers have applied. Click on a project to see more details.
          </p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '.notification-center',
      content: (
        <div className="p-2">
          <h3 className="text-lg font-semibold mb-2">Stay Updated 🔔</h3>
          <p className="text-sm text-gray-600">
            Check notifications for new applications, messages, and project updates. The red dot shows unread notifications.
          </p>
        </div>
      ),
      placement: 'bottom-end',
    },
    {
      target: '.user-menu',
      content: (
        <div className="p-2">
          <h3 className="text-lg font-semibold mb-2">Your Account 👤</h3>
          <p className="text-sm text-gray-600">
            Access your profile, settings, and logout from here. You can also see your online status.
          </p>
        </div>
      ),
      placement: 'bottom-end',
    },
  ];

  const handleJoyrideCallback = (data) => {
    const { action, index, status, type } = data;

    if (([STATUS.FINISHED, STATUS.SKIPPED]).includes(status)) {
      setRunJoyride(false);
      if (onTourEnd) {
        onTourEnd();
      }
    }
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous={true}
      run={runJoyride}
      scrollToFirstStep={true}
      showProgress={true}
      showSkipButton={true}
      steps={steps}
      styles={{
        options: {
          arrowColor: '#3b82f6',
          backgroundColor: '#ffffff',
          overlayColor: 'rgba(0, 0, 0, 0.4)',
          primaryColor: '#3b82f6',
          textColor: '#374151',
          width: 350,
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 8,
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        buttonNext: {
          backgroundColor: '#3b82f6',
          borderRadius: 6,
          color: '#ffffff',
          fontSize: 14,
          fontWeight: 500,
          padding: '8px 16px',
        },
        buttonBack: {
          color: '#6b7280',
          fontSize: 14,
          marginRight: 'auto',
        },
        buttonSkip: {
          color: '#6b7280',
          fontSize: 14,
        },
        spotlight: {
          borderRadius: 8,
        }
      }}
      locale={{
        back: 'Previous',
        close: 'Close',
        last: 'Finish Tour',
        next: 'Next',
        skip: 'Skip Tour',
      }}
    />
  );
};

// Tour Trigger Button Component
export const TourButton = ({ onClick }) => {
  const hasSeenTour = localStorage.getItem('client-tour-completed');
  
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
      title={hasSeenTour ? "Reload Tour" : "Take a guided tour"}
    >
      <QuestionMarkCircleIcon className="h-5 w-5" />
      <span className="hidden md:inline">{hasSeenTour ? "Reload Tour" : "Help Tour"}</span>
    </button>
  );
};

export default ClientTour;
