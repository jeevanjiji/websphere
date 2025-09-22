import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import WorkspaceInterface from './WorkspaceInterface';
import MinimalWorkspaceInterface from './MinimalWorkspaceInterface';
import StepByStepWorkspaceTest from './StepByStepWorkspaceTest';
import { useAuth } from '../contexts/AuthContext';

// Error Boundary to catch React errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('WorkspaceInterface Error:', error);
    console.error('Error Info:', errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-red-600 mb-4">WorkspaceInterface Error</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Error:</h3>
                <pre className="bg-red-100 p-2 rounded text-sm">
                  {this.state.error && this.state.error.toString()}
                </pre>
              </div>
              <div>
                <h3 className="font-semibold">Stack:</h3>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const DebugWorkspaceInterface = ({ projectId, applicationId, onClose }) => {
  const [debugInfo, setDebugInfo] = useState({
    step: 'initializing',
    error: null,
    data: null
  });
  const [showOriginal, setShowOriginal] = useState(false);
  const [showMinimal, setShowMinimal] = useState(false);
  const [showStepByStep, setShowStepByStep] = useState(false);

  // Test useAuth hook at component level (correct way)
  let authData = null;
  let authError = null;
  try {
    const { user } = useAuth();
    authData = {
      authHookWorking: true,
      user: user,
      userExists: !!user,
      userId: user?.id || user?._id,
      userType: user?.userType
    };
  } catch (error) {
    authError = error.message;
  }

  const testAuthContext = () => {
    if (authError) {
      setDebugInfo({
        step: 'auth-error',
        error: `Auth Context Error: ${authError}`,
        data: { useAuthAvailable: typeof useAuth === 'function' }
      });
    } else {
      setDebugInfo({
        step: 'auth-test',
        error: null,
        data: authData
      });
    }
  };

  useEffect(() => {
    debugWorkspaceTest();
  }, [projectId, applicationId]);

  const debugWorkspaceTest = async () => {
    try {
      setDebugInfo({ step: 'checking-token', error: null, data: null });
      
      const token = localStorage.getItem('token');
      if (!token) {
        setDebugInfo({ 
          step: 'error', 
          error: 'No token found in localStorage', 
          data: null 
        });
        return;
      }

      setDebugInfo({ 
        step: 'token-found', 
        error: null, 
        data: { hasToken: true, tokenLength: token.length } 
      });

      setDebugInfo({ step: 'fetching-workspace', error: null, data: null });
      
      const response = await fetch(`http://localhost:5000/api/workspaces/project/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setDebugInfo({ 
        step: 'response-received', 
        error: null, 
        data: { 
          status: response.status, 
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        } 
      });

      if (response.ok) {
        const data = await response.json();
        setDebugInfo({ 
          step: 'success', 
          error: null, 
          data: {
            fullResponse: data,
            workspace: data.data,
            userRole: data.userRole,
            workspaceId: data.data?._id,
            workspaceStatus: data.data?.status,
            hasProject: !!data.data?.project,
            hasClient: !!data.data?.client,
            hasFreelancer: !!data.data?.freelancer,
            hasApplication: !!data.data?.application
          }
        });
      } else {
        const errorData = await response.json();
        setDebugInfo({ 
          step: 'api-error', 
          error: `HTTP ${response.status}: ${errorData.message}`, 
          data: errorData 
        });
      }

    } catch (error) {
      setDebugInfo({ 
        step: 'fetch-error', 
        error: error.message, 
        data: { stack: error.stack } 
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl h-full max-h-[80vh] flex flex-col p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Debug Workspace Interface</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Props:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                {JSON.stringify({ projectId, applicationId }, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Current Step:</h3>
              <div className="bg-blue-100 p-4 rounded">
                <strong>{debugInfo.step}</strong>
              </div>
            </div>

            {debugInfo.error && (
              <div>
                <h3 className="text-lg font-semibold mb-2 text-red-600">Error:</h3>
                <div className="bg-red-100 p-4 rounded text-red-800">
                  {debugInfo.error}
                </div>
              </div>
            )}

            {debugInfo.data && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Debug Data:</h3>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                  {JSON.stringify(debugInfo.data, null, 2)}
                </pre>
              </div>
            )}

            <div className="mt-6 space-x-4">
              <button
                onClick={debugWorkspaceTest}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry Test
              </button>
              
              {debugInfo.step === 'success' && (
                <>
                  <button
                    onClick={() => setShowOriginal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Test Original Workspace
                  </button>
                  
                  <button
                    onClick={testAuthContext}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    Test Auth Context
                  </button>
                  
                  <button
                    onClick={() => setShowMinimal(true)}
                    className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                  >
                    Test Minimal Workspace
                  </button>
                  
                  <button
                    onClick={() => setShowStepByStep(true)}
                    className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                  >
                    Test Imports
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Show original workspace if requested */}
      {showOriginal && (
        <div className="fixed inset-0 bg-red-500 bg-opacity-20 z-[60]">
          <div className="absolute top-4 right-4 z-[70]">
            <button
              onClick={() => setShowOriginal(false)}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Close Original Test
            </button>
          </div>
          <ErrorBoundary>
            <WorkspaceInterface
              projectId={projectId}
              applicationId={applicationId}
              onClose={() => setShowOriginal(false)}
            />
          </ErrorBoundary>
        </div>
      )}
      
      {/* Show minimal workspace if requested */}
      {showMinimal && (
        <MinimalWorkspaceInterface
          projectId={projectId}
          applicationId={applicationId}
          onClose={() => setShowMinimal(false)}
        />
      )}
      
      {/* Show step-by-step test if requested */}
      {showStepByStep && (
        <StepByStepWorkspaceTest
          projectId={projectId}
          applicationId={applicationId}
          onClose={() => setShowStepByStep(false)}
        />
      )}
    </div>
  );
};

export default DebugWorkspaceInterface;