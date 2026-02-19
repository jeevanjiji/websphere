import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BellIcon, 
  XMarkIcon,
  ChatBubbleLeftIcon,
  BriefcaseIcon,
  UserIcon,
  CheckIcon,
  CurrencyRupeeIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api.js';

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  // Auto-filter notifications based on user role; no tab switching

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen && user) {
      fetchNotifications();
    }
  }, [isOpen, user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS.LIST}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 20 }
      });

      if (response.data.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'payment-reminder':
      case 'payment-overdue':
        return <CurrencyRupeeIcon className="h-5 w-5 text-green-600" />;
      case 'deliverable-reminder':
      case 'deliverable-overdue':
        return <DocumentTextIcon className="h-5 w-5 text-blue-600" />;
      case 'message':
        return <ChatBubbleLeftIcon className="h-5 w-5 text-purple-600" />;
      case 'project':
      case 'milestone':
        return <BriefcaseIcon className="h-5 w-5 text-orange-600" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const filteredNotifications = notifications.filter(n => {
    // Since notifications are already filtered by userRole on the backend,
    // we can show all notifications for the user's role
    // But we can still filter by type if needed for specific views
    
    if (user?.role === 'client') {
      // Client should see payment-related and project updates (deliverable status changes)
      return n.type?.includes('payment') || n.type?.includes('deliverable') || n.type?.includes('project');
    }
    if (user?.role === 'freelancer') {
      // Freelancer should see deliverable-related and payment updates (payment received)
      return n.type?.includes('deliverable') || n.type?.includes('payment') || n.type?.includes('project');
    }
    // Admin or unknown role: show all
    return true;
  });

  const formatTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInSeconds = (now - notificationTime) / 1000;

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    } else {
      return notificationTime.toLocaleDateString();
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read
      if (!notification.read) {
        const token = localStorage.getItem('token');
        await axios.put(
          `${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS.READ(notification._id)}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Update local state
        setNotifications(prev =>
          prev.map(n => n._id === notification._id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // Enhanced workspace ID extraction
      const extractWorkspaceId = (notification) => {
        const workspaceId = notification.workspaceId || notification.data?.workspaceId;
        
        if (!workspaceId) return null;
        
        if (typeof workspaceId === 'object' && workspaceId._id) {
          return String(workspaceId._id);
        }
        
        return String(workspaceId);
      };

      const workspaceIdStr = extractWorkspaceId(notification);
      
      if (workspaceIdStr) {
        
        // Navigate to appropriate dashboard with workspace parameters
        if (user?.role === 'freelancer') {
          // For freelancers, navigate to freelancer dashboard with workspace info
          const searchParams = new URLSearchParams({
            openWorkspace: 'true',
            workspaceId: workspaceIdStr
          });
          
          // Add specific tab based on notification type
          if (notification.type === 'payment') {
            searchParams.append('tab', 'payment');
          } else if (notification.type === 'milestone') {
            searchParams.append('tab', 'milestones');
          } else if (notification.type === 'deliverable') {
            searchParams.append('tab', 'deliverables');
          }
          
          navigate(`/freelancer?${searchParams.toString()}`);
        } else if (user?.role === 'client') {
          // For clients, navigate to client dashboard with workspace info
          const searchParams = new URLSearchParams({
            openWorkspace: 'true',
            workspaceId: workspaceIdStr
          });
          
          // Add specific tab based on notification type
          if (notification.type === 'deliverable-reminder' || notification.type === 'deliverable') {
            searchParams.append('tab', 'deliverables');
          } else if (notification.type === 'milestone') {
            searchParams.append('tab', 'milestones');
          } else if (notification.type === 'payment') {
            searchParams.append('tab', 'payments');
          }
          
          navigate(`/client?${searchParams.toString()}`);
        } else {
          // Fallback for admin or other roles
          navigate('/admin-dashboard');
        }
        
        setIsOpen(false);
      } else if (notification.type === 'due-date' || notification.type === 'deadline-reminder') {
        // For due date notifications without workspace, navigate to appropriate dashboard
        if (user?.role === 'client') {
          navigate('/client');
        } else if (user?.role === 'freelancer') {
          navigate('/freelancer');
        } else {
          navigate('/dashboard');
        }
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS.READ_ALL}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Notification Panel */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                  <p className="text-xs text-gray-500">
                    {user?.role === 'client' ? 'Payment reminders and overdue alerts' : user?.role === 'freelancer' ? 'Deliverable reminders and overdue alerts' : 'All notifications'}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading...</p>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {user?.role === 'client' ? 'No payment notifications yet' : user?.role === 'freelancer' ? 'No deliverable notifications yet' : 'No notifications yet'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredNotifications.map((notification) => (
                      <motion.div
                        key={notification._id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer group ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium text-gray-900 truncate ${
                              !notification.read ? 'font-semibold' : ''
                            }`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {notification.body}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatTime(notification.createdAt)}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
