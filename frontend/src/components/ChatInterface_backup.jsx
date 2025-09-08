// Backup of ChatInterface before fixing
import React from 'react';

const ChatInterface = ({ isOpen }) => {
  if (!isOpen) return null;
  return <div>Chat Interface</div>;
};

export default ChatInterface;
