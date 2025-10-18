import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  BanknotesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  EyeIcon,
  HandRaisedIcon
} from '@heroicons/react/24/outline';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api.js';

const EscrowManagement = () => {
  const [escrows, setEscrows] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedEscrow, setSelectedEscrow] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [releaseReason, setReleaseReason] = useState('');
  const [disputeResolution, setDisputeResolution] = useState({
    resolution: '',
    refundToClient: false,
    releaseToFreelancer: false,
    notes: ''
  });

  useEffect(() => {
    fetchEscrows();
    fetchStats();
  }, [selectedStatus, currentPage]);

  const fetchEscrows = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN.ESCROWS}?status=${selectedStatus}&page=${currentPage}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setEscrows(data.data);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        toast.error(data.message || 'Failed to fetch escrows');
      }
    } catch (error) {
      console.error('Error fetching escrows:', error);
      toast.error('Failed to fetch escrows');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN.ESCROWS_STATS}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching escrow stats:', error);
    }
  };

  const viewEscrowDetails = async (escrowId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN.ESCROW_BY_ID(escrowId)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setSelectedEscrow(data.data);
        setShowDetails(true);
      } else {
        toast.error(data.message || 'Failed to fetch escrow details');
      }
    } catch (error) {
      console.error('Error fetching escrow details:', error);
      toast.error('Failed to fetch escrow details');
    }
  };

  const handleReleaseFunds = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN.ESCROW_RELEASE(selectedEscrow._id)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ releaseReason })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Funds released successfully');
        setShowReleaseModal(false);
        setShowDetails(false);
        setReleaseReason('');
        fetchEscrows();
        fetchStats();
      } else {
        toast.error(data.message || 'Failed to release funds');
      }
    } catch (error) {
      console.error('Error releasing funds:', error);
      toast.error('Failed to release funds');
    }
  };

  const handleResolveDispute = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN.ESCROW_RESOLVE(selectedEscrow._id)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(disputeResolution)
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Dispute resolved successfully');
        setShowDisputeModal(false);
        setShowDetails(false);
        setDisputeResolution({
          resolution: '',
          refundToClient: false,
          releaseToFreelancer: false,
          notes: ''
        });
        fetchEscrows();
        fetchStats();
      } else {
        toast.error(data.message || 'Failed to resolve dispute');
      }
    } catch (error) {
      console.error('Error resolving dispute:', error);
      toast.error('Failed to resolve dispute');
    }
  };

  const processAutoReleases = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN.ESCROW_AUTO_RELEASE}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Auto-released ${data.data.releasedCount} escrows`);
        fetchEscrows();
        fetchStats();
      } else {
        toast.error(data.message || 'Failed to process auto-releases');
      }
    } catch (error) {
      console.error('Error processing auto-releases:', error);
      toast.error('Failed to process auto-releases');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, text: 'Pending' },
      active: { color: 'bg-blue-100 text-blue-800', icon: BanknotesIcon, text: 'Active' },
      released: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, text: 'Released' },
      disputed: { color: 'bg-red-100 text-red-800', icon: ExclamationTriangleIcon, text: 'Disputed' },
      refunded: { color: 'bg-gray-100 text-gray-800', icon: HandRaisedIcon, text: 'Refunded' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Escrow Management</h1>
        <button
          onClick={processAutoReleases}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Process Auto-Releases
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <BanknotesIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Escrows</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalEscrows || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pending Releases</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingReleases || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Disputes</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.disputes || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Value</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(stats.summary?.totalValue || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex flex-wrap gap-2">
          {['all', 'pending', 'active', 'released', 'disputed', 'refunded'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setSelectedStatus(status);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                selectedStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Escrow List */}
      <div className="bg-white shadow border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Milestone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client / Freelancer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {escrows.map((escrow) => (
                <tr key={escrow._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {escrow.milestone?.title || 'Unknown Milestone'}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {escrow._id.slice(-6)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {escrow.client?.fullName || 'Unknown Client'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {escrow.freelancer?.fullName || 'Unknown Freelancer'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(escrow.totalAmount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Fee: {formatCurrency(escrow.serviceCharge)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(escrow.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(escrow.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => viewEscrowDetails(escrow._id)}
                      className="text-blue-600 hover:text-blue-900 flex items-center"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Escrow Details Modal */}
      {showDetails && selectedEscrow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Escrow Details</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Milestone Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Milestone Information</h3>
                <p className="font-medium">{selectedEscrow.milestone?.title}</p>
                <p className="text-sm text-gray-600">{selectedEscrow.milestone?.description}</p>
              </div>

              {/* Financial Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Financial Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Milestone Amount:</span>
                    <p className="font-medium">{formatCurrency(selectedEscrow.milestoneAmount)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Service Charge:</span>
                    <p className="font-medium">{formatCurrency(selectedEscrow.serviceCharge)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Paid:</span>
                    <p className="font-medium">{formatCurrency(selectedEscrow.totalAmount)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">To Freelancer:</span>
                    <p className="font-medium">{formatCurrency(selectedEscrow.amountToFreelancer)}</p>
                  </div>
                </div>
              </div>

              {/* Status & Delivery */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Status & Delivery</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    {getStatusBadge(selectedEscrow.status)}
                  </div>
                  <div className="flex justify-between">
                    <span>Deliverable Submitted:</span>
                    <span className={
                      (selectedEscrow.deliverableSubmitted || 
                       selectedEscrow.deliverableSubmittedAt || 
                       selectedEscrow.clientApprovalStatus === 'approved') 
                      ? 'text-green-600' : 'text-red-600'
                    }>
                      {(selectedEscrow.deliverableSubmitted || 
                        selectedEscrow.deliverableSubmittedAt || 
                        selectedEscrow.clientApprovalStatus === 'approved') 
                       ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Client Approval:</span>
                    <span className="capitalize">{selectedEscrow.clientApprovalStatus}</span>
                  </div>
                  {selectedEscrow.disputeRaised && (
                    <div className="flex justify-between">
                      <span>Dispute:</span>
                      <span className="text-red-600">Active</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Timeline</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span>{formatDate(selectedEscrow.createdAt)}</span>
                  </div>
                  {selectedEscrow.activatedAt && (
                    <div className="flex justify-between">
                      <span>Activated:</span>
                      <span>{formatDate(selectedEscrow.activatedAt)}</span>
                    </div>
                  )}
                  {selectedEscrow.deliverableSubmittedAt && (
                    <div className="flex justify-between">
                      <span>Deliverable Submitted:</span>
                      <span>{formatDate(selectedEscrow.deliverableSubmittedAt)}</span>
                    </div>
                  )}
                  {selectedEscrow.releasedAt && (
                    <div className="flex justify-between">
                      <span>Funds Released:</span>
                      <span>{formatDate(selectedEscrow.releasedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {selectedEscrow.status === 'active' && 
                 selectedEscrow.deliverableSubmitted && 
                 selectedEscrow.clientApprovalStatus === 'approved' && (
                  <button
                    onClick={() => setShowReleaseModal(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Release Funds
                  </button>
                )}
                
                {selectedEscrow.status === 'disputed' && (
                  <button
                    onClick={() => setShowDisputeModal(true)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    Resolve Dispute
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Release Funds Modal */}
      {showReleaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Release Funds</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Release Reason</label>
                <textarea
                  value={releaseReason}
                  onChange={(e) => setReleaseReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="Enter reason for releasing funds..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleReleaseFunds}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Release Funds
                </button>
                <button
                  onClick={() => setShowReleaseModal(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Resolve Dispute</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Resolution</label>
                <select
                  value={disputeResolution.resolution}
                  onChange={(e) => setDisputeResolution({
                    ...disputeResolution,
                    resolution: e.target.value
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select resolution...</option>
                  <option value="release_to_freelancer">Release to Freelancer</option>
                  <option value="refund_to_client">Refund to Client</option>
                  <option value="partial_resolution">Partial Resolution</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={disputeResolution.releaseToFreelancer}
                    onChange={(e) => setDisputeResolution({
                      ...disputeResolution,
                      releaseToFreelancer: e.target.checked,
                      refundToClient: false
                    })}
                    className="mr-2"
                  />
                  Release funds to freelancer
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={disputeResolution.refundToClient}
                    onChange={(e) => setDisputeResolution({
                      ...disputeResolution,
                      refundToClient: e.target.checked,
                      releaseToFreelancer: false
                    })}
                    className="mr-2"
                  />
                  Refund to client
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Resolution Notes</label>
                <textarea
                  value={disputeResolution.notes}
                  onChange={(e) => setDisputeResolution({
                    ...disputeResolution,
                    notes: e.target.value
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="Enter resolution details..."
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleResolveDispute}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  Resolve Dispute
                </button>
                <button
                  onClick={() => setShowDisputeModal(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
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

export default EscrowManagement;