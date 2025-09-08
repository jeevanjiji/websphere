import React from 'react';

const TourDebugger = () => {
  const resetTour = () => {
    localStorage.removeItem('client-tour-completed');
    window.location.reload();
  };

  const triggerTour = () => {
    if (window.startClientTour) {
      window.startClientTour();
    }
  };

  const showTourState = () => {
    const hasSeenTour = localStorage.getItem('client-tour-completed');
    alert(`Tour completed: ${hasSeenTour ? 'Yes' : 'No'}`);
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-300 rounded-lg p-3 shadow-lg z-50">
      <div className="text-sm font-semibold mb-2 text-yellow-800">Tour Debugger</div>
      <div className="space-y-2">
        <button
          onClick={resetTour}
          className="block w-full px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
        >
          Reset Tour State
        </button>
        <button
          onClick={triggerTour}
          className="block w-full px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
        >
          Trigger Tour
        </button>
        <button
          onClick={showTourState}
          className="block w-full px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
        >
          Show State
        </button>
      </div>
    </div>
  );
};

export default TourDebugger;
