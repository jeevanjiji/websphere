import React from 'react';
import { motion } from 'framer-motion';
import { useSocket } from '../contexts/SocketContext';

const OnlineStatusIndicator = ({ userId, size = 'sm', showText = false, className = '' }) => {
  const { isUserOnline, isConnected } = useSocket();
  const online = isConnected && isUserOnline(userId);

  const sizeClasses = {
    xs: 'h-2 w-2',
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.div
        initial={false}
        animate={{ 
          scale: online ? [1, 1.2, 1] : 1,
          backgroundColor: online ? '#10b981' : '#6b7280'
        }}
        transition={{
          scale: {
            duration: 0.6,
            repeat: online ? Infinity : 0,
            repeatDelay: 2
          },
          backgroundColor: {
            duration: 0.3
          }
        }}
        className={`
          ${sizeClasses[size]} 
          rounded-full 
          border-2 
          border-white 
          shadow-sm
          ${online ? 'bg-green-500' : 'bg-gray-400'}
        `}
      />
      {showText && (
        <span className={`
          ${textSizes[size]} 
          font-medium 
          ${online ? 'text-green-600' : 'text-gray-500'}
        `}>
          {online ? 'Online' : 'Offline'}
        </span>
      )}
    </div>
  );
};

// Component to show online status in user avatars
export const UserAvatarWithStatus = ({ 
  user, 
  size = 'md', 
  showName = false, 
  className = '' 
}) => {
  const avatarSizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const statusSizes = {
    sm: 'xs',
    md: 'sm',
    lg: 'md',
    xl: 'lg'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        {user?.profilePicture ? (
          <img
            src={user.profilePicture}
            alt={user.fullName || user.username}
            className={`${avatarSizes[size]} rounded-full object-cover`}
          />
        ) : (
          <div className={`
            ${avatarSizes[size]} 
            rounded-full 
            bg-gradient-to-br from-blue-500 to-purple-600 
            flex items-center justify-center 
            text-white font-medium
          `}>
            {(user?.fullName || user?.username || '?').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="absolute -bottom-0.5 -right-0.5">
          <OnlineStatusIndicator 
            userId={user?._id || user?.userId} 
            size={statusSizes[size]}
          />
        </div>
      </div>
      
      {showName && (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user?.fullName || user?.username}
          </p>
          <OnlineStatusIndicator 
            userId={user?._id || user?.userId} 
            size="xs"
            showText
            className="mt-1"
          />
        </div>
      )}
    </div>
  );
};

// Component to show typing indicator
export const TypingIndicator = ({ chatId, className = '' }) => {
  const { getTypingUsersForChat } = useSocket();
  const typingUsers = getTypingUsersForChat(chatId);

  if (typingUsers.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={`flex items-center gap-2 text-sm text-gray-500 ${className}`}
    >
      <div className="flex gap-1">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
          className="h-2 w-2 bg-gray-400 rounded-full"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
          className="h-2 w-2 bg-gray-400 rounded-full"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
          className="h-2 w-2 bg-gray-400 rounded-full"
        />
      </div>
      <span>
        {typingUsers.length === 1 
          ? 'Someone is typing...' 
          : `${typingUsers.length} people are typing...`
        }
      </span>
    </motion.div>
  );
};

export default OnlineStatusIndicator;
