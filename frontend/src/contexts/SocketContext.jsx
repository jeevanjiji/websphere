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

  // Initialize socket connection
  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io(process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000', {
        withCredentials: true,
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('🔌 Connected to server');
        console.log('👤 User object:', user);
        setIsConnected(true);
        
        // Tell server user is online
        const userId = user.id || user._id || user.userId;
        console.log('📡 Emitting user-online for userId:', userId);
        newSocket.emit('user-online', userId);
      });

      newSocket.on('disconnect', () => {
        console.log('🔌 Disconnected from server');
        setIsConnected(false);
      });

      // Listen for online users updates
      newSocket.on('online-users', (users) => {
        setOnlineUsers(users);
      });

      newSocket.on('user-status-change', (data) => {
        const { userId, status } = data;
        setOnlineUsers(prev => {
          if (status === 'online') {
            return [...prev.filter(id => id !== userId), userId];
          } else {
            return prev.filter(id => id !== userId);
          }
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
          duration: 4000,
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

      // Listen for project updates
      newSocket.on('project-status-change', (data) => {
        console.log('📋 Project status changed:', data);
        toast.success(`Project status updated: ${data.status}`, {
          duration: 3000,
          icon: '📋',
        });
      });

      setSocket(newSocket);

      return () => {
        if (newSocket) {
          newSocket.emit('user-offline', user.id || user._id || user.userId);
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
        userId: user.id || user._id || user.userId, 
        chatId 
      });
    }
  };

  const emitTypingStop = (chatId) => {
    if (socket && user) {
      socket.emit('typing-stop', { 
        userId: user.id || user._id || user.userId, 
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
    console.log('🔍 Checking online status for userId:', userId, 'in onlineUsers:', onlineUsers);
    return onlineUsers.includes(userId);
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
