import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [deleteType, setDeleteType] = useState('soft'); // 'soft' or 'hard'
  const [deleteReason, setDeleteReason] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchDeletedUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('UserManagement - Fetching users with token:', token ? 'Token exists' : 'No token');

      const response = await fetch('http://localhost:5000/api/admin/users', {
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
      const response = await fetch('http://localhost:5000/api/admin/users/deleted', {
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

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem('token');
      const endpoint = deleteType === 'soft' 
        ? `http://localhost:5000/api/admin/users/${selectedUser._id}/soft-delete`
        : `http://localhost:5000/api/admin/users/${selectedUser._id}/hard-delete`;

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

  const handleRestoreUser = async (user) => {
    try {
      const confirmed = window.confirm(`Are you sure you want to restore ${user.fullName}'s account?`);

      if (confirmed) {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/admin/users/${user._id}/restore`, {
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
                          <button
                            onClick={() => handleDeleteUser(user, 'soft')}
                            className="text-yellow-600 hover:text-yellow-900 flex items-center space-x-1"
                            title="Deactivate User"
                          >
                            <TrashIcon className="h-4 w-4" />
                            <span>Deactivate</span>
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
    </div>
  );
};

export default UserManagement;
