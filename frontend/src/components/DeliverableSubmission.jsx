import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { 
  PaperClipIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon 
} from '@heroicons/react/24/outline';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api.js';

const DeliverableSubmission = ({ milestone, onSubmitted }) => {
  const [submissionData, setSubmissionData] = useState({
    notes: '',
    attachments: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const handleSubmitDeliverable = async () => {
    if (!submissionData.notes.trim()) {
      toast.error('Please add submission notes describing your work');
      return;
    }

    try {
      setSubmitting(true);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PAYMENTS.ESCROW_SUBMIT}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          milestoneId: milestone._id,
          notes: submissionData.notes,
          attachments: submissionData.attachments
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Deliverable submitted successfully!');
        setShowSubmitModal(false);
        setSubmissionData({ notes: '', attachments: [] });
        if (onSubmitted) onSubmitted();
      } else {
        toast.error(data.message || 'Failed to submit deliverable');
      }
    } catch (error) {
      console.error('Error submitting deliverable:', error);
      toast.error('Failed to submit deliverable');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmitDeliverable = () => {
    return milestone.escrowStatus === 'active' && 
           milestone.status !== 'review' && 
           milestone.status !== 'approved' &&
           milestone.status !== 'paid';
  };

  const getSubmissionStatus = () => {
    if (milestone.status === 'review') {
      return {
        icon: CheckCircleIcon,
        text: 'Under Review',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      };
    } else if (milestone.status === 'approved') {
      return {
        icon: CheckCircleIcon,
        text: 'Approved - Awaiting Fund Release',
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      };
    } else if (milestone.status === 'paid') {
      return {
        icon: CheckCircleIcon,
        text: 'Completed & Paid',
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      };
    } else if (milestone.status === 'rejected') {
      return {
        icon: ExclamationTriangleIcon,
        text: 'Rejected - Please Resubmit',
        color: 'text-red-600',
        bgColor: 'bg-red-50'
      };
    }
    return null;
  };

  const submissionStatus = getSubmissionStatus();

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Deliverable Submission</h3>
        {milestone.escrowStatus === 'active' && (
          <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
            Funds Secured in Escrow
          </span>
        )}
      </div>

      {submissionStatus && (
        <div className={`flex items-center p-3 rounded-lg mb-4 ${submissionStatus.bgColor}`}>
          <submissionStatus.icon className={`h-5 w-5 mr-2 ${submissionStatus.color}`} />
          <span className={`font-medium ${submissionStatus.color}`}>
            {submissionStatus.text}
          </span>
        </div>
      )}

      {/* Milestone Details */}
      <div className="bg-gray-50 p-3 rounded-lg mb-4">
        <h4 className="font-medium mb-2">{milestone.title}</h4>
        <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
        <div className="flex justify-between text-sm">
          <span>Amount: <strong>₹{milestone.amountToFreelancer || milestone.amount}</strong></span>
          <span>Due: <strong>{new Date(milestone.dueDate).toLocaleDateString()}</strong></span>
        </div>
      </div>

      {/* Requirements Checklist */}
      {milestone.requirements && milestone.requirements.length > 0 && (
        <div className="mb-4">
          <h5 className="font-medium mb-2">Requirements:</h5>
          <ul className="space-y-1">
            {milestone.requirements.map((req, index) => (
              <li key={index} className="flex items-start text-sm">
                <CheckCircleIcon className="h-4 w-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                {req.description}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Submission Notes (if already submitted) */}
      {milestone.submissionNotes && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start">
            <DocumentTextIcon className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 mb-1">Your Submission Notes:</p>
              <p className="text-sm text-blue-800">{milestone.submissionNotes}</p>
              {milestone.submissionDate && (
                <p className="text-xs text-blue-600 mt-1">
                  Submitted: {new Date(milestone.submissionDate).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review Notes (if client provided feedback) */}
      {milestone.reviewNotes && (
        <div className={`mb-4 p-3 rounded-lg ${
          milestone.status === 'approved' ? 'bg-green-50' : 'bg-red-50'
        }`}>
          <div className="flex items-start">
            <DocumentTextIcon className={`h-5 w-5 mr-2 mt-0.5 ${
              milestone.status === 'approved' ? 'text-green-600' : 'text-red-600'
            }`} />
            <div>
              <p className={`font-medium mb-1 ${
                milestone.status === 'approved' ? 'text-green-900' : 'text-red-900'
              }`}>
                Client Review:
              </p>
              <p className={`text-sm ${
                milestone.status === 'approved' ? 'text-green-800' : 'text-red-800'
              }`}>
                {milestone.reviewNotes}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Submit Deliverable Button */}
      {canSubmitDeliverable() && (
        <button
          onClick={() => setShowSubmitModal(true)}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Submit Deliverable
        </button>
      )}

      {milestone.status === 'rejected' && (
        <button
          onClick={() => setShowSubmitModal(true)}
          className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors"
        >
          Resubmit Deliverable
        </button>
      )}

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">
              {milestone.status === 'rejected' ? 'Resubmit' : 'Submit'} Deliverable
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Submission Notes *
                </label>
                <textarea
                  value={submissionData.notes}
                  onChange={(e) => setSubmissionData({
                    ...submissionData,
                    notes: e.target.value
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={4}
                  placeholder="Describe what you've completed, key features implemented, any important notes for the client..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Provide detailed information about your work and any instructions for the client.
                </p>
              </div>

              {/* File Attachments (placeholder for future implementation) */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Attachments (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <PaperClipIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    File attachments coming soon
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Important:</p>
                    <p>
                      Once submitted, your deliverable will be reviewed by the client. 
                      Funds will be released from escrow after client approval and admin confirmation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSubmitDeliverable}
                  disabled={submitting || !submissionData.notes.trim()}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Deliverable'}
                </button>
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliverableSubmission;