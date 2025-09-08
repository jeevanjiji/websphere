import React from 'react';

// This is a temporary component for testing the tour
// Remove this in production

const TourTester = () => {
  const resetTour = () => {
    localStorage.removeItem('client-tour-completed');
    window.location.reload();
  };

  const startTour = () => {
    if (window.startClientTour) {
      window.startClientTour();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white shadow-lg rounded-lg p-4 border">
      <h3 className="text-sm font-medium mb-2">Tour Testing</h3>
      <div className="space-y-2">
        <button 
          onClick={resetTour}
          className="block w-full px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
        >
          Reset Tour (Reload)
        </button>
        <button 
          onClick={startTour}
          className="block w-full px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
        >
          Start Tour Now
        </button>
      </div>
    </div>
  );
};

export default TourTester;
