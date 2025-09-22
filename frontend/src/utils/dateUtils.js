// Date and time utilities for consistent formatting across the app

/**
 * Format message timestamp with enhanced date/time display
 * Shows "Today HH:MM AM/PM", "Yesterday HH:MM AM/PM", or "Mon DD HH:MM AM/PM"
 */
export const formatMessageTime = (timestamp) => {
  const messageDate = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
  
  // Time formatting with AM/PM
  const timeStr = messageDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  
  // Date formatting based on recency
  if (messageDay.getTime() === today.getTime()) {
    return `Today ${timeStr}`;
  } else if (messageDay.getTime() === yesterday.getTime()) {
    return `Yesterday ${timeStr}`;
  } else {
    const dateStr = messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: messageDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
    return `${dateStr} ${timeStr}`;
  }
};

/**
 * Format chat list timestamp - more compact for lists
 * Shows "Today", "Yesterday", or "Mon DD"
 */
export const formatChatListTime = (timestamp) => {
  const messageDate = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
  
  // For chat lists, we show more compact format
  if (messageDay.getTime() === today.getTime()) {
    return messageDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } else if (messageDay.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else {
    return messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: messageDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
};

/**
 * Get a formatted date separator for chat messages
 * Shows "Today", "Yesterday", or "Monday, January 15"
 */
export const getDateSeparator = (timestamp) => {
  const messageDate = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
  
  if (messageDay.getTime() === today.getTime()) {
    return 'Today';
  } else if (messageDay.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else {
    return messageDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: messageDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
};

/**
 * Check if two dates are the same day
 */
export const isSameDay = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

/**
 * Format date with time and AM/PM for general use
 */
export const formatDateTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Group messages by date for display
 * Returns an array of { date: string, messages: [] } objects
 */
export const groupMessagesByDate = (messages) => {
  const groups = [];
  let currentGroup = null;
  
  messages.forEach(message => {
    const messageDate = new Date(message.createdAt);
    const dateKey = messageDate.toDateString();
    
    if (!currentGroup || currentGroup.dateKey !== dateKey) {
      currentGroup = {
        dateKey,
        dateSeparator: getDateSeparator(message.createdAt),
        messages: []
      };
      groups.push(currentGroup);
    }
    
    currentGroup.messages.push(message);
  });
  
  return groups;
};