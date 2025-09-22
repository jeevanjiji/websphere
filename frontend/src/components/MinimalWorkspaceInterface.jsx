import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const MinimalWorkspaceInterface = ({ projectId, applicationId, onClose }) => {
  console.log('🔍 MinimalWorkspaceInterface: Component started');
  
  // All hooks must be called at the top level
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [renderStep, setRenderStep] = useState('initialized');
  const [error, setError] = useState(null);
  
  console.log('🔍 MinimalWorkspaceInterface: Hooks completed');
  console.log('🔍 User from auth:', user);
  
  useEffect(() => {
    console.log('🔍 MinimalWorkspaceInterface: useEffect starting');
    setRenderStep('useEffect-started');
    
    const fetchData = async () => {
      try {
        setRenderStep('fetching-data');
        console.log('🔍 Fetching workspace data...');
        
        const token = localStorage.getItem('token');
        console.log('🔍 Token exists:', !!token);
        
        const response = await fetch(`http://localhost:5000/api/workspaces/project/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('🔍 Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 Data received:', data);
          setWorkspace(data.data);
          setRenderStep('data-loaded');
        } else {
          setError(`API Error: ${response.status}`);
          setRenderStep('api-error');
        }
      } catch (err) {
        console.error('🔍 Fetch error:', err);
        setError(err.message);
        setRenderStep('fetch-error');
      } finally {
        setLoading(false);
        setRenderStep('complete');
        console.log('🔍 Fetch complete');
      }
    };
    
    fetchData();
  }, [projectId, applicationId]);
  
  console.log('🔍 MinimalWorkspaceInterface: About to render');
  console.log('🔍 Current state:', { loading, renderStep, error, workspace: !!workspace });
  
  // Always render something visible
  return (
    <div className="fixed inset-0 bg-red-500 bg-opacity-30 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border-2 border-red-500">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-red-600">Minimal Workspace Test</h2>
          <button
            onClick={onClose}
            className="text-red-500 hover:text-red-700 text-xl font-bold"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-3 text-sm">
          <p><strong>Status:</strong> {loading ? 'Loading...' : 'Complete'}</p>
          <p><strong>Step:</strong> {renderStep}</p>
          <p><strong>User ID:</strong> {user?.id || user?._id || 'No User'}</p>
          <p><strong>Project ID:</strong> {projectId}</p>
          {error && <p className="text-red-600"><strong>Error:</strong> {error}</p>}
          {workspace && (
            <>
              <p><strong>Workspace ID:</strong> {workspace._id}</p>
              <p><strong>Workspace Status:</strong> {workspace.status}</p>
            </>
          )}
        </div>
        
        <div className="mt-6 flex space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Close
          </button>
          <button
            onClick={() => console.log('Current state:', { loading, renderStep, error, workspace })}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Log State
          </button>
        </div>
      </div>
    </div>
  );
};

export default MinimalWorkspaceInterface;