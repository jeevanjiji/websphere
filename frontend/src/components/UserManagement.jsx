import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL, API_ENDPOINTS, buildApiUrl } from '../config/api';
import { 
  TrashIcon, 
  ArrowPathIcon, 
  ExclamationTriangleIcon,
  UserIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deleteType, setDeleteType] = useState('soft'); // 'soft' or 'hard'
  const [deleteReason, setDeleteReason] = useState('');
  const [deactivationReason, setDeactivationReason] = useState('');
  const [selectedPresetReason, setSelectedPresetReason] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchDeletedUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('UserManagement - Fetching users with token:', token ? 'Token exists' : 'No token');

      const response = await fetch(buildApiUrl(API_ENDPOINTS.ADMIN.USERS), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('UserManagement - Users response status:', response.status);
      const data = await response.json();
      console.log('UserManagement - Users data:', data);

      if (data.success) {
        setUsers(data.users);
        console.log('UserManagement - Users set:', data.users);
      } else {
        console.error('UserManagement - Users API returned success: false', data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeletedUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl(API_ENDPOINTS.ADMIN.USERS_DELETED), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setDeletedUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching deleted users:', error);
    }
  };

  const handleDeleteUser = (user, type = 'soft') => {
    setSelectedUser(user);
    setDeleteType(type);
    setShowDeleteModal(true);
    setDeleteReason('');
    setAdminPassword('');
  };

  const handleDeactivateUser = (user) => {
    setSelectedUser(user);
    setShowDeactivateModal(true);
    // Set default reason for low rating
    const defaultReason = `Failed to maintain minimum rating requirement of 2.5 stars with ${user.completedProjects || 0} freelancing projects.`;
    setDeactivationReason(defaultReason);
    setSelectedPresetReason('rating');
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem('token');
      const endpoint = deleteType === 'soft' 
        ? buildApiUrl(API_ENDPOINTS.ADMIN.USER_SOFT_DELETE(selectedUser._id))
        : buildApiUrl(API_ENDPOINTS.ADMIN.USER_HARD_DELETE(selectedUser._id));

      const method = deleteType === 'soft' ? 'PATCH' : 'DELETE';
      const body = deleteType === 'soft' 
        ? { reason: deleteReason }
        : { confirmPassword: adminPassword };

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(deleteType === 'soft' ? 'User Deactivated' : 'User Deleted');

        // Refresh the user lists
        fetchUsers();
        fetchDeletedUsers();
        setShowDeleteModal(false);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const confirmDeactivateUser = async () => {
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl(API_ENDPOINTS.ADMIN.USER_DEACTIVATE(selectedUser._id)), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: deactivationReason })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        fetchUsers();
        setShowDeactivateModal(false);
        setSelectedUser(null);
        setDeactivationReason('');
        setSelectedPresetReason('');
      } else {
        toast.error(data.message || 'Failed to deactivate user');
      }
    } catch (error) {
      console.error('Error deactivating user:', error);
      toast.error('Error deactivating user');
    }
  };

  const presetReasons = [
    {
      id: 'rating',
      label: 'Low Rating (Below 2.5 stars)',
      template: (user) => `Failed to maintain minimum rating requirement of 2.5 stars with ${user.completedProjects || 0} freelancing projects.`
    },
    {
      id: 'quality',
      label: 'Poor Work Quality',
      template: (user) => `Multiple complaints about work quality and failure to meet project requirements with ${user.completedProjects || 0} completed projects.`
    },
    {
      id: 'communication',
      label: 'Poor Communication',
      template: (user) => `Consistent issues with client communication and responsiveness affecting project delivery.`
    },
    {
      id: 'violation',
      label: 'Terms of Service Violation',
      template: (user) => `Violation of WebSphere Terms of Service and community guidelines.`
    },
    {
      id: 'custom',
      label: 'Custom Reason',
      template: (user) => ''
    }
  ];

  const handlePresetReasonChange = (reasonId) => {
    setSelectedPresetReason(reasonId);
    const preset = presetReasons.find(r => r.id === reasonId);
    if (preset && selectedUser) {
      setDeactivationReason(preset.template(selectedUser));
    }
  };

  const handleReactivateUser = async (user) => {
    try {
      const confirmed = window.confirm(`Are you sure you want to reactivate ${user.fullName}'s freelancer account?`);

      if (confirmed) {
        const token = localStorage.getItem('token');
        const response = await fetch(buildApiUrl(API_ENDPOINTS.ADMIN.USER_REACTIVATE(user._id)), {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (data.success) {
          toast.success(data.message);
          fetchUsers();
        } else {
          toast.error(data.message || 'Failed to reactivate user');
        }
      }
    } catch (error) {
      console.error('Error reactivating user:', error);
      toast.error('Error reactivating user');
    }
  };

  const handleRestoreUser = async (user) => {
    try {
      const confirmed = window.confirm(`Are you sure you want to restore ${user.fullName}'s account?`);

      if (confirmed) {
        const token = localStorage.getItem('token');
        const response = await fetch(buildApiUrl(API_ENDPOINTS.ADMIN.USER_RESTORE(user._id)), {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        
        if (data.success) {
          toast.success('User restored successfully!');
          fetchUsers();
          fetchDeletedUsers();
        } else {
          toast.error(data.message);
        }
      }
    } catch (error) {
      console.error('Error restoring user:', error);
      toast.error('Failed to restore user');
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'client': return 'bg-blue-100 text-blue-800';
      case 'freelancer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteAllFreelancersForTesting = async () => {
    try {
      const confirmed = window.confirm(
        '⚠️ TESTING ONLY: This will permanently delete ALL freelancer accounts. Are you sure?'
      );

      if (confirmed) {
        const doubleConfirm = window.confirm(
          '🚨 FINAL WARNING: This action cannot be undone. All freelancer data will be lost. Continue?'
        );

        if (doubleConfirm) {
          const token = localStorage.getItem('token');
          const response = await fetch(buildApiUrl(API_ENDPOINTS.ADMIN.USERS_DELETE_ALL_FREELANCERS), {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          const data = await response.json();

          if (data.success) {
            toast.success(`${data.deletedCount} freelancer accounts deleted for testing`);
            fetchUsers();
          } else {
            toast.error(data.message || 'Failed to delete freelancer accounts');
          }
        }
      }
    } catch (error) {
      console.error('Error deleting freelancer accounts:', error);
      toast.error('Error deleting freelancer accounts');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowDeleted(!showDeleted)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              showDeleted
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {showDeleted ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            <span>{showDeleted ? 'Hide Deleted' : 'Show Deleted'}</span>
          </button>
          <button
            onClick={handleDeleteAllFreelancersForTesting}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            title="TESTING ONLY: Delete all freelancer accounts"
          >
            <ExclamationTriangleIcon className="h-5 w-5" />
            <span>🧪 Delete All Freelancers</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {showDeleted ? `Deleted Users (${deletedUsers.length})` : `Active Users (${users.length})`}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {showDeleted ? 'Deleted' : 'Joined'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(showDeleted ? deletedUsers : users).map((user) => (
                <motion.tr
                  key={user._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.profilePicture ? (
                          <img className="h-10 w-10 rounded-full" src={user.profilePicture} alt="" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {user.isVerified && (
                        <ShieldCheckIcon className="h-4 w-4 text-green-500" title="Verified" />
                      )}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isDeleted 
                          ? 'bg-red-100 text-red-800' 
                          : user.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user.isDeleted ? 'Deleted' : user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {showDeleted ? formatDate(user.deletedAt) : formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {showDeleted ? (
                        <button
                          onClick={() => handleRestoreUser(user)}
                          className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                          title="Restore User"
                        >
                          <ArrowPathIcon className="h-4 w-4" />
                          <span>Restore</span>
                        </button>
                      ) : (
                        <>
                          {user.role === 'freelancer' && user.isActive && (
                            <button
                              onClick={() => handleDeactivateUser(user)}
                              className="text-orange-600 hover:text-orange-900 flex items-center space-x-1"
                              title="Deactivate Freelancer Account"
                            >
                              <ExclamationTriangleIcon className="h-4 w-4" />
                              <span>Deactivate</span>
                            </button>
                          )}
                          {user.role === 'freelancer' && !user.isActive && (
                            <button
                              onClick={() => handleReactivateUser(user)}
                              className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                              title="Reactivate Freelancer Account"
                            >
                              <ArrowPathIcon className="h-4 w-4" />
                              <span>Reactivate</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(user, 'soft')}
                            className="text-yellow-600 hover:text-yellow-900 flex items-center space-x-1"
                            title="Soft Delete User"
                          >
                            <TrashIcon className="h-4 w-4" />
                            <span>Soft Delete</span>
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user, 'hard')}
                            className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                            title="Permanently Delete"
                          >
                            <ExclamationTriangleIcon className="h-4 w-4" />
                            <span>Delete</span>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md w-full"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {deleteType === 'soft' ? 'Deactivate User Account' : 'Permanently Delete User'}
                </h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  {deleteType === 'soft' 
                    ? 'This will deactivate the user account. The account can be restored later.'
                    : 'This will permanently delete the user account. This action cannot be undone!'
                  }
                </p>
                
                {selectedUser && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium">{selectedUser.fullName}</p>
                    <p className="text-sm text-gray-600">{selectedUser.email}</p>
                  </div>
                )}
              </div>

              {deleteType === 'soft' ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for deactivation (optional)
                  </label>
                  <textarea
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Enter reason for deactivation..."
                  />
                </div>
              ) : (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm your admin password *
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter your password to confirm"
                    required
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteUser}
                  disabled={deleteType === 'hard' && !adminPassword}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                    deleteType === 'soft'
                      ? 'bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-300'
                      : 'bg-red-600 hover:bg-red-700 disabled:bg-red-300'
                  }`}
                >
                  {deleteType === 'soft' ? 'Deactivate' : 'Permanently Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deactivation Modal */}
      <AnimatePresence>
        {showDeactivateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-orange-600 mr-3" />
                <h3 className="text-lg font-medium text-gray-900">
                  Deactivate Freelancer Account
                </h3>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to deactivate this freelancer account? The user will no longer be able to log in and their profile will be hidden from clients. They will receive an email notification explaining the reason.
                </p>
                
                {selectedUser && (
                  <div className="bg-gray-50 p-4 rounded-md mb-4">
                    <div className="flex items-center mb-2">
                      {selectedUser.profilePicture ? (
                        <img className="h-10 w-10 rounded-full mr-3" src={selectedUser.profilePicture} alt="" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                          <UserIcon className="h-6 w-6 text-gray-600" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{selectedUser.fullName}</p>
                        <p className="text-sm text-gray-600">{selectedUser.email}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-gray-500">Role:</span>
                        <span className="ml-2 font-medium">{selectedUser.role}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedUser.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedUser.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Rating:</span>
                        <span className="ml-2 font-medium">
                          {selectedUser.rating && selectedUser.rating.average > 0 
                            ? `${selectedUser.rating.average.toFixed(1)}/5.0 (${selectedUser.rating.count} reviews)`
                            : 'No ratings yet'
                          }
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Projects:</span>
                        <span className="ml-2 font-medium">{selectedUser.completedProjects || 0} completed</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">Member since:</span>
                        <span className="ml-2 font-medium">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for deactivation *
                </label>
                
                {/* Preset Reasons */}
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-2">Choose a preset reason:</p>
                  <div className="space-y-2">
                    {presetReasons.map((preset) => (
                      <label key={preset.id} className="flex items-center">
                        <input
                          type="radio"
                          name="presetReason"
                          value={preset.id}
                          checked={selectedPresetReason === preset.id}
                          onChange={(e) => handlePresetReasonChange(e.target.value)}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">{preset.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Custom Reason Textarea */}
                <textarea
                  value={deactivationReason}
                  onChange={(e) => {
                    setDeactivationReason(e.target.value);
                    if (e.target.value !== presetReasons.find(r => r.id === selectedPresetReason)?.template(selectedUser)) {
                      setSelectedPresetReason('custom');
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows="4"
                  placeholder="Enter detailed reason for deactivation (this will be sent to the freelancer)..."
                  required
                />
                
                <p className="text-xs text-gray-500 mt-2">
                  💡 This message will be included in the email sent to the freelancer explaining why their account was deactivated.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeactivateModal(false);
                    setSelectedUser(null);
                    setDeactivationReason('');
                    setSelectedPresetReason('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeactivateUser}
                  disabled={!deactivationReason.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 rounded-md transition-colors"
                >
                  Deactivate & Send Email
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;
