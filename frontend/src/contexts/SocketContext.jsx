import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const { user, isAuthenticated } = useAuth();

  const getUserId = (u) => {
    if (!u) return undefined;
    return String(u._id || u.id || u.userId || '');
  };

  // Initialize socket connection
  useEffect(() => {
    if (isAuthenticated && user) {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? '' : 'http://localhost:5000');
      const newSocket = io(apiBaseUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('🔌 Connected to server');
        console.log('👤 User object:', user);
        setIsConnected(true);
        
        // Tell server user is online
        const userId = getUserId(user);
        console.log('📡 Emitting user-online for userId:', userId);
        console.log('👤 Full user object:', JSON.stringify(user, null, 2));
        console.log('🔌 Socket ID:', newSocket.id);
        newSocket.emit('user-online', userId);
      });

      newSocket.on('disconnect', () => {
        console.log('🔌 Disconnected from server');
        setIsConnected(false);
      });

      // Listen for online users updates
      newSocket.on('online-users', (users) => {
        console.log('👥 Received online users:', users);
        setOnlineUsers(users);
      });

      newSocket.on('user-status-change', (data) => {
        console.log('👤 User status change received:', data);
        const { userId, status } = data;
        setOnlineUsers(prev => {
          const updated = status === 'online' 
            ? [...prev.filter(id => id !== userId), userId]
            : prev.filter(id => id !== userId);
          console.log('👥 Updated online users:', updated);
          return updated;
        });
      });

      // Listen for new messages
      newSocket.on('message-received', (messageData) => {
        console.log('📨 New message received:', messageData);
        // This will be handled by individual chat components
      });

      // Listen for notifications
      newSocket.on('notification', (notification) => {
        console.log('🔔 New notification:', notification);
        
        // Add to notifications list
        setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10
        
        // Show toast notification
        toast.success(notification.body, {
          duration: 5000, // 5 seconds for notifications
          dismissible: true,
          position: 'top-right',
          icon: '💬',
        });
      });

      // Listen for typing indicators
      newSocket.on('user-typing', (data) => {
        const { userId, chatId, isTyping } = data;
        setTypingUsers(prev => {
          const key = `${chatId}-${userId}`;
          const updated = { ...prev };
          
          if (isTyping) {
            updated[key] = { userId, chatId, timestamp: Date.now() };
          } else {
            delete updated[key];
          }
          
          return updated;
        });
      });

      // Listen for incoming video calls
      newSocket.on('incoming-video-call', (callData) => {
        console.log('📹 Incoming video call:', callData);
        
        const callerId = String(callData?.fromUser?._id || callData?.fromUser?.id || callData?.fromUser?.userId || '');
        const currentUserId = getUserId(user);
        if (callerId && currentUserId && callerId === currentUserId) {
          console.log('🚫 Ignoring self incoming-video-call event');
          return;
        }
        // Show notification for incoming call
        toast.success(`Incoming video call from ${callData.fromUser.fullName}`, {
          duration: 10000, // 10 seconds for calls
          dismissible: true,
          position: 'top-center',
          icon: '📹',
        });
        
        // You can emit a custom event to be handled by the workspace component
        window.dispatchEvent(new CustomEvent('incoming-video-call', { detail: callData }));
      });

      // Listen for call responses
      newSocket.on('call-response-received', (responseData) => {
        console.log('📹 Call response received:', responseData);
        window.dispatchEvent(new CustomEvent('call-response-received', { detail: responseData }));
      });

      newSocket.on('call-request-sent', (data) => {
        console.log('📹 Call request sent:', data);
        toast.success(`Video call request sent to ${data.toUser.fullName}`);
      });

      newSocket.on('call-request-failed', (data) => {
        console.log('📹 Call request failed:', data);
        toast.error(`Failed to reach ${data.toUser.fullName}: ${data.reason}`);
      });

      // WebRTC signaling events
      newSocket.on('webrtc-offer', (data) => {
        window.dispatchEvent(new CustomEvent('webrtc-offer', { detail: data }));
      });

      newSocket.on('webrtc-answer', (data) => {
        window.dispatchEvent(new CustomEvent('webrtc-answer', { detail: data }));
      });

      newSocket.on('webrtc-ice-candidate', (data) => {
        window.dispatchEvent(new CustomEvent('webrtc-ice-candidate', { detail: data }));
      });

      newSocket.on('call-ended', (data) => {
        console.log('📹 Call ended:', data);
        const who = typeof data?.endedBy === 'string' ? data.endedBy : (data?.endedBy?.fullName || 'other participant');
        toast(`Video call ended by ${who}`, { icon: '📹' });
        window.dispatchEvent(new CustomEvent('call-ended', { detail: data }));
      });

      // Listen for project updates
      newSocket.on('project-status-change', (data) => {
        console.log('📋 Project status changed:', data);
        toast.success(`Project status updated: ${data.status}`, {
          duration: 4000, // 4 seconds for project updates
          dismissible: true,
          icon: '📋',
        });
      });

      setSocket(newSocket);

      return () => {
        if (newSocket) {
          newSocket.emit('user-offline', getUserId(user));
          newSocket.disconnect();
        }
      };
    }
  }, [isAuthenticated, user]);

  // Cleanup typing indicators that are too old
  useEffect(() => {
    const interval = setInterval(() => {
      setTypingUsers(prev => {
        const now = Date.now();
        const filtered = {};
        
        Object.entries(prev).forEach(([key, data]) => {
          if (now - data.timestamp < 5000) { // Remove after 5 seconds
            filtered[key] = data;
          }
        });
        
        return filtered;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Socket utility functions
  const emitMessage = (messageData) => {
    if (socket) {
      socket.emit('new-message', messageData);
    }
  };

  const emitTypingStart = (chatId) => {
    if (socket && user) {
      socket.emit('typing-start', { 
        userId: getUserId(user), 
        chatId 
      });
    }
  };

  const emitTypingStop = (chatId) => {
    if (socket && user) {
      socket.emit('typing-stop', { 
        userId: getUserId(user), 
        chatId 
      });
    }
  };

  const emitProjectUpdate = (projectData) => {
    if (socket) {
      socket.emit('project-update', projectData);
    }
  };

  const isUserOnline = (userId) => {
    const normalized = String(userId);
    const isOnline = onlineUsers.includes(normalized);
    console.log('🔍 Checking online status for userId:', normalized);
    console.log('👥 Current onlineUsers array:', onlineUsers);
    console.log('✅ Result:', isOnline);
    return isOnline;
  };

  const getTypingUsersForChat = (chatId) => {
    return Object.values(typingUsers).filter(data => data.chatId === chatId);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const markNotificationAsRead = (index) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };

  const value = {
    socket,
    isConnected,
    onlineUsers,
    notifications,
    typingUsers,
    // Utility functions
    emitMessage,
    emitTypingStart,
    emitTypingStop,
    emitProjectUpdate,
    isUserOnline,
    getTypingUsersForChat,
    clearNotifications,
    markNotificationAsRead
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
