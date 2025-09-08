import React from 'react';
import { motion } from 'framer-motion';
import { 
  WifiIcon, 
  ExclamationTriangleIcon,
  SignalIcon
} from '@heroicons/react/24/outline';
import { useSocket } from '../contexts/SocketContext';

const ConnectionStatus = ({ className = '' }) => {
  const { isConnected } = useSocket();

  if (isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-2 text-green-600 text-sm ${className}`}
      >
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3
          }}
        >
          <SignalIcon className="h-4 w-4" />
        </motion.div>
        <span className="font-medium">Live updates active</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-2 text-amber-600 text-sm ${className}`}
    >
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <ExclamationTriangleIcon className="h-4 w-4" />
      </motion.div>
      <span className="font-medium">Reconnecting...</span>
    </motion.div>
  );
};

// Component to show in navbar or header
export const HeaderConnectionStatus = ({ className = '' }) => {
  const { isConnected, onlineUsers } = useSocket();

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {isConnected ? (
        <div className="flex items-center gap-2 text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium hidden md:inline">
            {onlineUsers.length} online
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-amber-600">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
          <span className="text-sm font-medium hidden md:inline">
            Connecting...
          </span>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
