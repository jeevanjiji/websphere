import React, { useState, useEffect } from 'react';

// Test imports one by one
const StepByStepWorkspaceTest = ({ projectId, applicationId, onClose }) => {
  const [step, setStep] = useState(1);
  const [error, setError] = useState(null);
  const [results, setResults] = useState({});

  const testStep = async (stepNumber, testName, testFunction) => {
    try {
      console.log(`🔍 Testing Step ${stepNumber}: ${testName}`);
      const result = await testFunction();
      setResults(prev => ({ ...prev, [stepNumber]: { success: true, result } }));
      console.log(`✅ Step ${stepNumber} passed:`, result);
      return true;
    } catch (err) {
      console.error(`❌ Step ${stepNumber} failed:`, err);
      setError(`Step ${stepNumber} (${testName}): ${err.message}`);
      setResults(prev => ({ ...prev, [stepNumber]: { success: false, error: err.message } }));
      return false;
    }
  };

  const runTests = async () => {
    // Step 1: Test basic React hooks
    if (!(await testStep(1, 'Basic React Hooks', async () => {
      const [test, setTest] = useState('test');
      return 'React hooks working';
    }))) return;

    // Step 2: Test useAuth import and call
    if (!(await testStep(2, 'useAuth Hook', async () => {
      const { useAuth } = await import('../contexts/AuthContext');
      return 'useAuth imported successfully';
    }))) return;

    // Step 3: Test toast import
    if (!(await testStep(3, 'Toast Import', async () => {
      const { toast } = await import('react-hot-toast');
      return 'toast imported successfully';
    }))) return;

    // Step 4: Test Heroicons imports
    if (!(await testStep(4, 'Heroicons Import', async () => {
      const icons = await import('@heroicons/react/24/outline');
      return `${Object.keys(icons).length} icons imported`;
    }))) return;

    // Step 5: Test ChatInterface import
    if (!(await testStep(5, 'ChatInterface Import', async () => {
      const ChatInterface = await import('./ChatInterface');
      return 'ChatInterface imported successfully';
    }))) return;

    // Step 6: Test MilestoneStatusManager import
    if (!(await testStep(6, 'MilestoneStatusManager Import', async () => {
      const MilestoneStatusManager = await import('./MilestoneStatusManager');
      return 'MilestoneStatusManager imported successfully';
    }))) return;

    // Step 7: Test MilestoneTemplateModal import
    if (!(await testStep(7, 'MilestoneTemplateModal Import', async () => {
      const MilestoneTemplateModal = await import('./MilestoneTemplateModal');
      return 'MilestoneTemplateModal imported successfully';
    }))) return;

    // Step 8: Test PaymentModal import
    if (!(await testStep(8, 'PaymentModal Import', async () => {
      const { PaymentModal } = await import('./PaymentModal');
      return 'PaymentModal imported successfully';
    }))) return;

    // If we reach here, all imports are working
    setStep(9);
    console.log('✅ All imports successful!');
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="fixed inset-0 bg-blue-500 bg-opacity-30 flex items-center justify-center z-[70]">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl border-2 border-blue-500">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-blue-600">Step-by-Step Import Test</h2>
          <button
            onClick={onClose}
            className="text-blue-500 hover:text-blue-700 text-xl font-bold"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-2 text-sm max-h-64 overflow-y-auto">
          <p><strong>Current Step:</strong> {step}/8</p>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          <div className="space-y-1">
            {Object.entries(results).map(([stepNum, result]) => (
              <div key={stepNum} className={`p-2 rounded text-xs ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <strong>Step {stepNum}:</strong> {result.success ? '✅ ' + result.result : '❌ ' + result.error}
              </div>
            ))}
          </div>
          
          {step === 9 && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded">
              <strong>All imports successful!</strong> The issue is not with imports.
            </div>
          )}
        </div>
        
        <div className="mt-4 flex space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Close
          </button>
          <button
            onClick={runTests}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Retry Tests
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepByStepWorkspaceTest;