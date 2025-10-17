import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { API_BASE_URL, API_ENDPOINTS, buildApiUrl } from '../config/api';
import { 
  CheckCircleIcon,
  XMarkIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  HandThumbUpIcon,
  HandThumbDownIcon 
} from '@heroicons/react/24/outline';

const DeliverableApproval = ({ milestone, onApprovalSubmitted }) => {
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalData, setApprovalData] = useState({
    approved: null,
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  const handleApprovalSubmit = async () => {
    if (approvalData.approved === null) {
      toast.error('Please select approve or reject');
      return;
    }

    try {
      setSubmitting(true);

      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl(API_ENDPOINTS.PAYMENTS.APPROVE_DELIVERABLE), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          milestoneId: milestone._id,
          approved: approvalData.approved,
          notes: approvalData.notes
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(approvalData.approved ? 'Deliverable approved!' : 'Deliverable rejected');
        setShowApprovalModal(false);
        setApprovalData({ approved: null, notes: '' });
        if (onApprovalSubmitted) onApprovalSubmitted();
      } else {
        toast.error(data.message || 'Failed to submit approval');
      }
    } catch (error) {
      console.error('Error submitting approval:', error);
      toast.error('Failed to submit approval');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRaiseDispute = async () => {
    if (!disputeReason.trim()) {
      toast.error('Please provide a reason for the dispute');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl(API_ENDPOINTS.PAYMENTS.RAISE_DISPUTE), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          milestoneId: milestone._id,
          disputeReason
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Dispute raised successfully. Admin will review.');
        setShowDisputeModal(false);
        setDisputeReason('');
        if (onApprovalSubmitted) onApprovalSubmitted();
      } else {
        toast.error(data.message || 'Failed to raise dispute');
      }
    } catch (error) {
      console.error('Error raising dispute:', error);
      toast.error('Failed to raise dispute');
    }
  };

  const getApprovalStatus = () => {
    if (milestone.status === 'review') {
      return {
        icon: ClockIcon,
        text: 'Awaiting Your Review',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        canApprove: true
      };
    } else if (milestone.status === 'approved') {
      return {
        icon: CheckCircleIcon,
        text: 'Approved - Funds Will Be Released',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        canApprove: false
      };
    } else if (milestone.status === 'paid') {
      return {
        icon: CheckCircleIcon,
        text: 'Completed & Paid',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        canApprove: false
      };
    } else if (milestone.status === 'rejected') {
      return {
        icon: XMarkIcon,
        text: 'Rejected - Awaiting Resubmission',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        canApprove: false
      };
    } else if (milestone.status === 'disputed') {
      return {
        icon: ExclamationTriangleIcon,
        text: 'Under Dispute - Admin Reviewing',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        canApprove: false
      };
    }
    return {
      icon: ClockIcon,
      text: 'Pending Deliverable Submission',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      canApprove: false
    };
  };

  const approvalStatus = getApprovalStatus();

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Deliverable Review</h3>
        {milestone.escrowStatus === 'active' && (
          <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
            Funds Secured in Escrow
          </span>
        )}
      </div>

      {/* Status */}
      <div className={`flex items-center p-3 rounded-lg mb-4 ${approvalStatus.bgColor}`}>
        <approvalStatus.icon className={`h-5 w-5 mr-2 ${approvalStatus.color}`} />
        <span className={`font-medium ${approvalStatus.color}`}>
          {approvalStatus.text}
        </span>
      </div>

      {/* Milestone Details */}
      <div className="bg-gray-50 p-3 rounded-lg mb-4">
        <h4 className="font-medium mb-2">{milestone.title}</h4>
        <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
        <div className="flex justify-between text-sm">
          <span>Total Amount: <strong>₹{milestone.totalAmountPaid || milestone.amount}</strong></span>
          <span>To Freelancer: <strong>₹{milestone.amountToFreelancer || milestone.amount}</strong></span>
        </div>
        {milestone.serviceCharge && (
          <div className="text-xs text-gray-500 mt-1">
            Platform Fee: ₹{milestone.serviceCharge}
          </div>
        )}
      </div>

      {/* Submission Details */}
      {milestone.submissionNotes && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start">
            <DocumentTextIcon className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-blue-900 mb-1">Freelancer's Submission:</p>
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

      {/* Your Review (if already reviewed) */}
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
                Your Review:
              </p>
              <p className={`text-sm ${
                milestone.status === 'approved' ? 'text-green-800' : 'text-red-800'
              }`}>
                {milestone.reviewNotes}
              </p>
              {milestone.reviewDate && (
                <p className={`text-xs mt-1 ${
                  milestone.status === 'approved' ? 'text-green-600' : 'text-red-600'
                }`}>
                  Reviewed: {new Date(milestone.reviewDate).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        {approvalStatus.canApprove && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setApprovalData({ approved: true, notes: '' });
                setShowApprovalModal(true);
              }}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
            >
              <HandThumbUpIcon className="h-4 w-4 mr-1" />
              Approve
            </button>
            <button
              onClick={() => {
                setApprovalData({ approved: false, notes: '' });
                setShowApprovalModal(true);
              }}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
            >
              <HandThumbDownIcon className="h-4 w-4 mr-1" />
              Reject
            </button>
          </div>
        )}
        
        {(milestone.status === 'approved' || milestone.status === 'review') && (
          <button
            onClick={() => setShowDisputeModal(true)}
            className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center"
          >
            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
            Raise Dispute
          </button>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">
              {approvalData.approved ? 'Approve' : 'Reject'} Deliverable
            </h3>
            
            <div className="space-y-4">
              <div className={`p-3 rounded-lg ${
                approvalData.approved ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className="flex items-start">
                  {approvalData.approved ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                  ) : (
                    <XMarkIcon className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                  )}
                  <div className="text-sm">
                    {approvalData.approved ? (
                      <p className="text-green-800">
                        Approving will signal that the work meets your requirements. 
                        Funds will be released from escrow after admin confirmation.
                      </p>
                    ) : (
                      <p className="text-red-800">
                        Rejecting will require the freelancer to resubmit the deliverable. 
                        Please provide clear feedback on what needs to be improved.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {approvalData.approved ? 'Approval Notes (Optional)' : 'Rejection Reason *'}
                </label>
                <textarea
                  value={approvalData.notes}
                  onChange={(e) => setApprovalData({
                    ...approvalData,
                    notes: e.target.value
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                  placeholder={
                    approvalData.approved 
                      ? "Any additional feedback or appreciation..."
                      : "Please specify what needs to be changed or improved..."
                  }
                  required={!approvalData.approved}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleApprovalSubmit}
                  disabled={submitting || (!approvalData.approved && !approvalData.notes.trim())}
                  className={`flex-1 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    approvalData.approved 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {submitting ? 'Submitting...' : (approvalData.approved ? 'Approve' : 'Reject')}
                </button>
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Raise Dispute</h3>
            
            <div className="space-y-4">
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 mr-2 mt-0.5" />
                  <div className="text-sm text-orange-800">
                    <p className="font-medium mb-1">Important:</p>
                    <p>
                      Raising a dispute will pause the escrow release and notify the admin for review. 
                      Please provide clear details about the issue.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Dispute Reason *
                </label>
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={4}
                  placeholder="Describe the issue with the deliverable, what wasn't completed as requested, quality concerns, etc..."
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleRaiseDispute}
                  disabled={!disputeReason.trim()}
                  className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Raise Dispute
                </button>
                <button
                  onClick={() => setShowDisputeModal(false)}
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

export default DeliverableApproval;