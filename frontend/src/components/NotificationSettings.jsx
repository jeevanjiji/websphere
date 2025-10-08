// frontend/src/components/NotificationSettings.jsx
import React, { useState, useEffect } from 'react';
import { 
  BellIcon, 
  BellSlashIcon, 
  CheckCircleIcon,
  XCircleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import pushNotificationService from '../services/pushNotificationService';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const NotificationSettings = ({ isOpen, onClose, isDropdown = false }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    email: true,
    push: true,
    paymentReminders: true,
    deliverableReminders: true,
    dueDateAlerts: true,
    overdueAlerts: true
  });
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [isPermissionBlocked, setIsPermissionBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPreferences();
      checkPushStatus();
    }
  }, [isOpen]);

  const loadPreferences = async () => {
    try {
      const prefs = await pushNotificationService.getPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Failed to load preferences:', error);
      toast.error('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const checkPushStatus = async () => {
    try {
      const isSubscribed = await pushNotificationService.isSubscribed();
      setIsPushEnabled(isSubscribed);
      setIsPermissionBlocked(pushNotificationService.isPermissionBlocked());
    } catch (error) {
      console.error('Failed to check push status:', error);
    }
  };

  const handleTogglePush = async () => {
    try {
      if (isPushEnabled) {
        await pushNotificationService.unsubscribe();
        setIsPushEnabled(false);
        toast.success('Push notifications disabled');
      } else {
        if (isPermissionBlocked) {
          toast.error('Notifications are blocked. Please enable them in your browser settings.');
          return;
        }
        await pushNotificationService.subscribe();
        setIsPushEnabled(true);
        setIsPermissionBlocked(false);
        toast.success('Push notifications enabled!');
      }
    } catch (error) {
      console.error('Failed to toggle push:', error);
      if (error.message === 'PERMISSION_BLOCKED') {
        setIsPermissionBlocked(true);
        toast.error('Notifications are blocked. Please enable them in your browser settings.');
      } else {
        toast.error(error.message || 'Failed to update push notification settings');
      }
    }
  };

  const handlePreferenceChange = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await pushNotificationService.updatePreferences(preferences);
      toast.success('Notification preferences saved!');
      onClose();
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await pushNotificationService.testNotification();
      toast.success('Test notification sent!');
    } catch (error) {
      toast.error('Failed to send test notification');
    }
  };

  if (!isOpen) return null;

  const content = (
    <>
      {/* Header */}
      {!isDropdown && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Cog6ToothIcon className="w-6 h-6" />
              <h2 className="text-xl font-bold">Notification Settings</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <XCircleIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Dropdown Header */}
      {isDropdown && (
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircleIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className={isDropdown ? "p-4 max-h-80 overflow-y-auto" : "p-6 overflow-y-auto flex-1 min-h-0"}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Push Notifications Toggle */}
              <div className={`border rounded-lg p-4 ${
                isPermissionBlocked 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isPushEnabled ? (
                      <BellIcon className="w-6 h-6 text-blue-600" />
                    ) : (
                      <BellSlashIcon className={`w-6 h-6 ${isPermissionBlocked ? 'text-red-400' : 'text-gray-400'}`} />
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">Browser Push Notifications</h3>
                      <p className="text-sm text-gray-600">
                        Receive real-time notifications in your browser
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleTogglePush}
                    disabled={isPermissionBlocked && !isPushEnabled}
                    className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      isPushEnabled ? 'bg-blue-600' : 'bg-gray-300'
                    } ${isPermissionBlocked && !isPushEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        isPushEnabled ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                {isPermissionBlocked && (
                  <div className="mt-3 bg-white border border-red-300 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <XCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-900 mb-1">Notifications Blocked</p>
                        <p className="text-sm text-gray-700 mb-2">
                          To enable push notifications, you need to unblock them in your browser:
                        </p>
                        <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside mb-2">
                          <li>Click the lock icon (🔒) or info icon (ⓘ) in your browser's address bar</li>
                          <li>Find "Notifications" in the site permissions</li>
                          <li>Change the setting from "Block" to "Allow"</li>
                          <li>Reload this page and try again</li>
                        </ol>
                        <button
                          onClick={() => window.location.reload()}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Reload page now →
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {isPushEnabled && (
                  <button
                    onClick={handleTestNotification}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Send test notification
                  </button>
                )}
              </div>

              {/* Email Notifications */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Channels</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        📧
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Email Notifications</p>
                        <p className="text-sm text-gray-600">Receive updates via email</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end w-16">
                      <button
                        onClick={() => handlePreferenceChange('email')}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          preferences.email ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                            preferences.email ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        🔔
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Push Notifications</p>
                        <p className="text-sm text-gray-600">Receive browser notifications</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end w-16">
                      <button
                        onClick={() => handlePreferenceChange('push')}
                        disabled={!isPushEnabled}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          preferences.push ? 'bg-blue-600' : 'bg-gray-300'
                        } ${!isPushEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                            preferences.push ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notification Types - Role Specific */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">What to notify me about</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {user?.role === 'client' 
                    ? 'Get notified about payment due dates and project milestones' 
                    : user?.role === 'freelancer'
                    ? 'Get notified about deliverable deadlines and project updates'
                    : 'Get notified about important project events'
                  }
                </p>
                
                <div className="space-y-4">
                  {/* Client-specific notifications */}
                  {user?.role === 'client' && (
                    <>
                      <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            💳
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Payment Reminders</p>
                            <p className="text-sm text-gray-600">3-day and 1-day payment due date alerts</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-end w-16">
                          <button
                            onClick={() => handlePreferenceChange('paymentReminders')}
                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              preferences.paymentReminders ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                preferences.paymentReminders ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            �
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Overdue Payment Alerts</p>
                            <p className="text-sm text-gray-600">Immediate alerts when payments become overdue</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-end w-16">
                          <button
                            onClick={() => handlePreferenceChange('overdueAlerts')}
                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              preferences.overdueAlerts ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                preferences.overdueAlerts ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            📊
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Deliverable Updates</p>
                            <p className="text-sm text-gray-600">When freelancers submit or update deliverables</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-end w-16">
                          <button
                            onClick={() => handlePreferenceChange('deliverableReminders')}
                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              preferences.deliverableReminders ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                preferences.deliverableReminders ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Freelancer-specific notifications */}
                  {user?.role === 'freelancer' && (
                    <>
                      <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            �
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Deliverable Reminders</p>
                            <p className="text-sm text-gray-600">3-day and 1-day deliverable due date alerts</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-end w-16">
                          <button
                            onClick={() => handlePreferenceChange('deliverableReminders')}
                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              preferences.deliverableReminders ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                preferences.deliverableReminders ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            🚨
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Overdue Deliverable Alerts</p>
                            <p className="text-sm text-gray-600">Immediate alerts when deliverables become overdue</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-end w-16">
                          <button
                            onClick={() => handlePreferenceChange('overdueAlerts')}
                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              preferences.overdueAlerts ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                preferences.overdueAlerts ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            💰
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Payment Updates</p>
                            <p className="text-sm text-gray-600">When clients process payments or approve milestones</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-end w-16">
                          <button
                            onClick={() => handlePreferenceChange('paymentReminders')}
                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              preferences.paymentReminders ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                preferences.paymentReminders ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Common notification for both roles */}
                  <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                        📅
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Project Milestone Updates</p>
                        <p className="text-sm text-gray-600">Status changes, approvals, and important project events</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end w-16">
                      <button
                        onClick={() => handlePreferenceChange('dueDateAlerts')}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          preferences.dueDateAlerts ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                            preferences.dueDateAlerts ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Development Testing */}
              {import.meta.env.MODE === 'development' && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Development Testing</h3>
                  <button
                    onClick={async () => {
                      try {
                        const response = await axios.post('/api/notifications/trigger-due-date-check');
                        if (response.data.success) {
                          toast.success('Notification check triggered! Check your notifications.');
                        }
                      } catch (error) {
                        toast.error('Failed to trigger notification check');
                      }
                    }}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
                  >
                    🧪 Trigger Overdue Check (Dev)
                  </button>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <p className="font-medium text-blue-900 mb-1">Smart Notifications</p>
                    <p>We'll send you timely reminders to help you meet deadlines and manage payments effectively. You can customize these settings anytime.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isDropdown && (
          <div className="border-t bg-gray-50 px-6 py-4 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        )}
      </>
    );

    // Return different wrappers based on mode
    if (isDropdown) {
      return content;
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[calc(100vh-1rem)] overflow-hidden flex flex-col">
          {content}
        </div>
      </div>
    );
};

export default NotificationSettings;
