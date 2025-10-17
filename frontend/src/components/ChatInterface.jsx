import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { motion } from 'framer-motion';
import { 
  PaperAirplaneIcon,
  PaperClipIcon,
  XMarkIcon,
  UserIcon,
  CurrencyDollarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import Button from './ui/Button';
import { toast } from 'react-hot-toast';
import { formatMessageTime } from '../utils/dateUtils';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api.js';

const ChatInterface = ({ chatId, isOpen, onClose, user, isWorkspaceChat = false }) => {
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chat, setChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerDetails, setOfferDetails] = useState({
    proposedRate: '',
    timeline: '',
    description: ''
  });

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (chatId && isOpen) {
      fetchChatDetails();
    }
  }, [chatId, isOpen]);

  // Listen for real-time messages and join chat room
  useEffect(() => {
    if (!socket || !chatId) return;
    
    // Join the chat room
    socket.emit('join-chat', chatId);
    console.log('🔗 Joined chat room:', chatId);
    
    const handleMessageReceived = (data) => {
      console.log('📨 Received message in chat:', data);
      if (data.chatId === chatId) {
        setMessages(prev => [...prev, data.message]);
        scrollToBottom();
      }
    };
    
    socket.on('message-received', handleMessageReceived);
    
    return () => {
      socket.off('message-received', handleMessageReceived);
      socket.emit('leave-chat', chatId);
      console.log('🚪 Left chat room:', chatId);
    };
  }, [socket, chatId]);
  useEffect(() => {
    scrollToBottom();
  }, [messages]);



  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CHATS.BY_ID(chatId)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setChat(data.chat);
        setMessages(data.messages);
      } else {
        toast.error(data.message || 'Failed to load chat');
      }
    } catch (error) {
      console.error('Error fetching chat:', error);
      toast.error('Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (messageData) => {
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CHATS.MESSAGES(chatId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(messageData)
      });

      const data = await response.json();
      if (data.success) {
        // Don't add message here - let socket handle it to avoid duplicates
        setNewMessage('');
        setShowOfferForm(false);
        setOfferDetails({ proposedRate: '', timeline: '', description: '' });
      } else {
        toast.error(data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    sendMessage({
      content: newMessage.trim(),
      messageType: 'text'
    });
  };

  const handleSendOffer = (e) => {
    e.preventDefault();
    if (!offerDetails.proposedRate || !offerDetails.timeline) {
      toast.error('Please fill in all required fields');
      return;
    }

    sendMessage({
      content: `New offer: Rs.${offerDetails.proposedRate} - ${offerDetails.timeline}`,
      messageType: 'offer',
      offerDetails: {
        proposedRate: parseFloat(offerDetails.proposedRate),
        timeline: offerDetails.timeline,
        description: offerDetails.description
      }
    });
  };

  const isCurrentUser = (senderId) => {
    const currentUserId = user?.id || user?._id || user?.userId;
    return senderId === currentUserId;
  };

  const getOtherParticipant = () => {
    if (!chat?.participants) return null;
    const currentUserId = user?.id || user?._id || user?.userId;
    return chat.participants.find(p => p.user._id !== currentUserId)?.user;
  };



  if (!isOpen) return null;

  // Render embedded version for workspace
  if (isWorkspaceChat) {
    return (
      <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {getOtherParticipant()?.profilePicture ? (
                <img
                  src={getOtherParticipant().profilePicture}
                  alt={getOtherParticipant().fullName}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <UserIcon className="h-4 w-4 text-gray-600" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-gray-900">
                  {getOtherParticipant()?.fullName}
                </h3>
                <div className="text-sm text-gray-500">
                  Project: {chat?.project?.title}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">💬</div>
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isMine = message.sender._id === user.id;
              return (
                <div
                  key={message._id}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] rounded-lg p-3 ${
                    isMine 
                      ? 'bg-green-600 text-white' 
                      : 'bg-white border border-gray-200'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    
                    <div className={`text-xs mt-1 ${
                      isMine ? 'text-green-100' : 'text-gray-500'
                    }`}>
                      {formatMessageTime(message.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                disabled={sending}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
              >
                <PaperClipIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <Button
              type="submit"
              variant="primary"
              disabled={!newMessage.trim() || sending}
              className="flex items-center gap-2"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
              {sending ? 'Sending...' : 'Send'}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Render modal version for regular chat
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {getOtherParticipant()?.profilePicture ? (
                <img
                  src={getOtherParticipant().profilePicture}
                  alt={getOtherParticipant().fullName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-white" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-gray-900">
                  {getOtherParticipant()?.fullName || 'Chat'}
                </h3>
                <p className="text-sm text-gray-600">
                  {chat?.project?.title}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {user?.role === 'client' && (
              <Button
                variant="secondary"
                size="small"
                onClick={() => setShowOfferForm(!showOfferForm)}
              >
                Make Offer
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Project Info */}
        {chat?.project && (
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                <span>Rs.{chat.project.budgetAmount} ({chat.project.budgetType})</span>
              </div>
              {chat.project.deadline && (
                <div className="flex items-center gap-1">
                  <ClockIcon className="h-4 w-4 text-gray-400" />
                  <span>Due: {new Date(chat.project.deadline).toLocaleDateString()}</span>
                </div>
              )}
              <div className="ml-auto">
                <span className="text-gray-600">
                  Application Rate: Rs.{chat.application?.proposedRate}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Offer Form */}
        {showOfferForm && (
          <div className="p-4 bg-blue-50 border-b border-gray-200">
            <form onSubmit={handleSendOffer} className="space-y-3">
              <h4 className="font-medium text-gray-900">Make an Offer</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proposed Rate (Rs.)
                  </label>
                  <input
                    type="number"
                    value={offerDetails.proposedRate}
                    onChange={(e) => setOfferDetails(prev => ({ ...prev, proposedRate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timeline
                  </label>
                  <input
                    type="text"
                    value={offerDetails.timeline}
                    onChange={(e) => setOfferDetails(prev => ({ ...prev, timeline: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 2-3 weeks"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Details
                </label>
                <textarea
                  value={offerDetails.description}
                  onChange={(e) => setOfferDetails(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Any additional terms or conditions..."
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="primary" size="small">
                  Send Offer
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="small"
                  onClick={() => setShowOfferForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isMine = isCurrentUser(message.sender._id);
              return (
                <div
                  key={message._id}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isMine
                        ? 'bg-green-500 text-white rounded-bl-lg rounded-tl-lg rounded-tr-sm rounded-br-lg shadow-md'
                        : message.messageType === 'system'
                        ? 'bg-gray-100 text-gray-700 text-center'
                        : 'bg-white text-gray-900 rounded-br-lg rounded-tr-lg rounded-tl-sm rounded-bl-lg shadow-md border border-gray-200'
                    }`}
                  >
                    {message.messageType === 'offer' && (
                      <div className="mb-2 p-2 bg-green-100 rounded text-green-800 text-sm">
                        <div className="font-medium">Offer Details:</div>
                        <div>Rate: Rs.{message.offerDetails?.proposedRate}</div>
                        <div>Timeline: {message.offerDetails?.timeline}</div>
                        {message.offerDetails?.description && (
                          <div>Terms: {message.offerDetails.description}</div>
                        )}
                      </div>
                    )}
                    
                    <p className="text-sm">{message.content}</p>
                    
                    <div className={`text-xs mt-1 ${
                      isMine ? 'text-green-100' : 'text-gray-500'
                    }`}>
                      {formatMessageTime(message.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                disabled={sending}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
              >
                <PaperClipIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <Button
              type="submit"
              variant="primary"
              disabled={!newMessage.trim() || sending}
              className="flex items-center gap-2"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
              {sending ? 'Sending...' : 'Send'}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ChatInterface;
