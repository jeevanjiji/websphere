import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { PaymentModal } from './PaymentModal';

const MilestoneStatusManager = ({ milestone, user, onStatusUpdate, onRefresh }) => {
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [statusData, setStatusData] = useState({
    status: milestone.status,
    notes: '',
    attachments: []
  });
  const [uploading, setUploading] = useState(false);

  const isClient = user?.role === 'client';
  const isFreelancer = user?.role === 'freelancer';

  // Define allowed status transitions
  const getAvailableStatusTransitions = () => {
    const currentStatus = milestone.status;
    
    if (isClient) {
      switch (currentStatus) {
        case 'pending':
          return [
            { value: 'approved', label: 'Approve Milestone', color: 'bg-green-600' },
            { value: 'rejected', label: 'Request Changes', color: 'bg-red-600' }
          ];
        case 'in-progress':
          return [
            { value: 'pending', label: 'Reset to Pending', color: 'bg-yellow-600' }
          ];
        case 'review':
          return [
            { value: 'approved', label: 'Approve Completion', color: 'bg-green-600' },
            { value: 'rejected', label: 'Request Revisions', color: 'bg-red-600' },
            { value: 'in-progress', label: 'Back to Progress', color: 'bg-blue-600' }
          ];
        case 'approved':
          return [
            { value: 'paid', label: 'Mark as Paid', color: 'bg-purple-600', action: 'payment' }
          ];
        default:
          return [];
      }
    } else if (isFreelancer) {
      switch (currentStatus) {
        case 'approved':
          return [
            { value: 'in-progress', label: 'Start Working', color: 'bg-blue-600' }
          ];
        case 'in-progress':
          return [
            { value: 'review', label: 'Submit for Review', color: 'bg-purple-600' }
          ];
        case 'rejected':
          return [
            { value: 'in-progress', label: 'Resume Work', color: 'bg-blue-600' }
          ];
        default:
          return [];
      }
    }
    return [];
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const requestBody = {
        status: newStatus,
        ...(statusData.notes && { 
          [isClient ? 'reviewNotes' : 'progressNotes']: statusData.notes 
        })
      };

      if (newStatus === 'review') {
        requestBody.submissionDate = new Date().toISOString();
        requestBody.submissionNotes = statusData.notes;
      }

      const response = await fetch(
        `http://localhost:5000/api/workspaces/${milestone.workspace}/milestones/${milestone._id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (response.ok) {
        toast.success(`Milestone ${newStatus.replace('-', ' ')} successfully!`);
        setShowStatusForm(false);
        setStatusData({ status: newStatus, notes: '', attachments: [] });
        onRefresh();
      } else {
        throw new Error('Failed to update milestone status');
      }
    } catch (error) {
      console.error('Error updating milestone status:', error);
      toast.error('Failed to update milestone status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'review': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'paid': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'approved': return '✅';
      case 'in-progress': return '🔄';
      case 'review': return '👀';
      case 'rejected': return '❌';
      case 'paid': return '💰';
      default: return '📋';
    }
  };

  const availableTransitions = getAvailableStatusTransitions();

  return (
    <div className="milestone-status-manager">
      {/* Current Status Display */}
      <div className={`inline-flex items-center px-3 py-2 rounded-lg border ${getStatusColor(milestone.status)}`}>
        <span className="mr-2">{getStatusIcon(milestone.status)}</span>
        <span className="font-medium">
          {milestone.status.replace('-', ' ').toUpperCase()}
        </span>
      </div>

      {/* Status Transition Buttons */}
      {availableTransitions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {availableTransitions.map((transition) => (
            <button
              key={transition.value}
              onClick={() => {
                if (transition.action === 'payment') {
                  setShowPaymentModal(true);
                } else {
                  setStatusData(prev => ({ ...prev, status: transition.value }));
                  setShowStatusForm(true);
                }
              }}
              className={`px-3 py-2 text-white text-sm rounded-lg hover:opacity-90 transition-opacity ${transition.color}`}
            >
              {transition.label}
            </button>
          ))}
        </div>
      )}

      {/* Status Change Form Modal */}
      {showStatusForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Update Milestone Status
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Changing status from <strong>{milestone.status.replace('-', ' ')}</strong> to{' '}
                <strong>{statusData.status.replace('-', ' ')}</strong>
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                {isClient ? 'Review Notes' : 'Progress Notes'} (Optional)
              </label>
              <textarea
                value={statusData.notes}
                onChange={(e) => setStatusData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 h-20"
                placeholder={`Add ${isClient ? 'review' : 'progress'} notes...`}
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => handleStatusChange(statusData.status)}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Confirm Update
              </button>
              <button
                onClick={() => setShowStatusForm(false)}
                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Requirements Checklist */}
      {milestone.requirements && milestone.requirements.length > 0 && (
        <div className="mt-4 bg-gray-50 rounded-lg p-3">
          <h4 className="text-sm font-medium mb-2">Requirements Progress</h4>
          <div className="space-y-2">
            {milestone.requirements.map((req, index) => (
              <div key={index} className="flex items-center">
                <input
                  type="checkbox"
                  checked={req.isCompleted}
                  readOnly
                  className="mr-2"
                />
                <span className={`text-sm ${req.isCompleted ? 'line-through text-gray-500' : ''}`}>
                  {req.description}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${milestone.completionPercentage || 0}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {milestone.completionPercentage || 0}% Complete
          </p>
        </div>
      )}

      {/* Timeline Information */}
      <div className="mt-4 text-sm text-gray-600">
        <div className="grid grid-cols-2 gap-2">
          {milestone.dueDate && (
            <div>
              <span className="font-medium">Due Date:</span>{' '}
              {new Date(milestone.dueDate).toLocaleDateString()}
            </div>
          )}
          {milestone.daysRemaining !== null && (
            <div className={milestone.daysRemaining < 0 ? 'text-red-600' : ''}>
              <span className="font-medium">
                {milestone.daysRemaining < 0 ? 'Overdue by:' : 'Days Left:'}
              </span>{' '}
              {Math.abs(milestone.daysRemaining)} days
            </div>
          )}
          {milestone.submissionDate && (
            <div>
              <span className="font-medium">Submitted:</span>{' '}
              {new Date(milestone.submissionDate).toLocaleDateString()}
            </div>
          )}
          {milestone.completedDate && (
            <div>
              <span className="font-medium">Completed:</span>{' '}
              {new Date(milestone.completedDate).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {/* Notes Display */}
      {(milestone.submissionNotes || milestone.reviewNotes) && (
        <div className="mt-4 space-y-2">
          {milestone.submissionNotes && (
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-sm font-medium text-blue-800">Freelancer Notes:</p>
              <p className="text-sm text-blue-700">{milestone.submissionNotes}</p>
            </div>
          )}
          {milestone.reviewNotes && (
            <div className="bg-green-50 p-3 rounded">
              <p className="text-sm font-medium text-green-800">Client Review:</p>
              <p className="text-sm text-green-700">{milestone.reviewNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        milestone={milestone}
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentSuccess={(paymentData) => {
          toast.success('Payment completed successfully!');
          onRefresh();
        }}
      />
    </div>
  );
};

export default MilestoneStatusManager;