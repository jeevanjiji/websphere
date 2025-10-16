import React, { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { toast } from 'react-hot-toast';
import ChatInterface from './ChatInterface';
import FileViewer from './FileViewerNew';
import VideoCall from './VideoCall';
import { PaymentModal } from './PaymentModal';
import { 
  ChatBubbleLeftRightIcon, 
  FolderIcon, 
  FlagIcon, 
  ArchiveBoxIcon,
  CreditCardIcon,
  EyeIcon,
  VideoCameraIcon,
  ArrowDownTrayIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';


const WorkspaceInterfaceFixed = ({ projectId, applicationId, onClose }) => {
  console.log('� WorkspaceInterfaceFixed: Component starting to render');
  console.log('�🔍 WorkspaceInterface: Component rendering with props:', { projectId, applicationId });

  const { user } = useAuth();
  console.log('🔍 WorkspaceInterface: Got user from useAuth:', user);
  const { isUserOnline, socket } = useSocket();
  console.log('🔍 WorkspaceInterface: User from AuthContext:', user);
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [milestones, setMilestones] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [files, setFiles] = useState([]);
  const [payments, setPayments] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [showDeliverableForm, setShowDeliverableForm] = useState(false);
  const [submittingDeliverable, setSubmittingDeliverable] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalMilestone, setApprovalMilestone] = useState(null);
  const [approvalAction, setApprovalAction] = useState(''); // 'approve' or 'reject'
  const [reviewNotes, setReviewNotes] = useState('');
  const [skipNextMilestoneFetch, setSkipNextMilestoneFetch] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showFileViewer, setShowFileViewer] = useState(false);
  
  // Deliverable Review States
  const [showDeliverableReview, setShowDeliverableReview] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState(null);
  const [reviewAction, setReviewAction] = useState(''); // 'approve' or 'decline'
  const [deliverableReviewNotes, setDeliverableReviewNotes] = useState('');
  const [processingReview, setProcessingReview] = useState(false);
  
  // Chat Integration States
  const [showDeliverableChat, setShowDeliverableChatModal] = useState(false);
  const [deliverableForChat, setDeliverableForChat] = useState(null);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);

  // Video call state
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [otherParticipant, setOtherParticipant] = useState(null);
  const [currentCallId, setCurrentCallId] = useState(null);
  // New: incoming call popup state
  const [incomingCall, setIncomingCall] = useState(null); // { callId, fromUser, workspaceId, projectTitle }
  
  // Debug: Watch incomingCall state changes
  useEffect(() => {
    console.log('📹 IncomingCall state changed:', incomingCall);
  }, [incomingCall]);
  const [callAccepted, setCallAccepted] = useState(false);

  const getId = (obj) => (obj ? String(obj._id || obj.id || obj.userId || '') : '');

  // Listen for incoming video call events (from socket and window fallback)
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data) => {
      console.log('📹 Incoming call event payload:', data);
      // Only show for the current workspace
      if (!data?.workspaceId || !workspace?._id || data.workspaceId !== workspace._id) {
        console.log('📹 Incoming call for different workspace, ignoring');
        return;
      }
      // If already in a call, ignore new incoming
      if (showVideoCall) {
        console.log('🚫 Already in a call, ignoring new incoming call');
        return;
      }
      setIncomingCall(data);
    };

    const socketHandler = (data) => handleIncomingCall(data);
    const windowHandler = (e) => handleIncomingCall(e.detail);

    socket.on('incoming-video-call', socketHandler);
    window.addEventListener('incoming-video-call', windowHandler);

    return () => {
      socket.off('incoming-video-call', socketHandler);
      window.removeEventListener('incoming-video-call', windowHandler);
    };
  }, [socket, workspace, showVideoCall]);

  // Listen for call response (for caller) and call-ended
  useEffect(() => {
    if (!socket) return;

    const handleCallResponse = (data) => {
      console.log('📹 Received call response:', data);
      
      if (data.accepted) {
        toast.success(`${data.responder?.fullName || 'Participant'} accepted the call!`);
        setCurrentCallId(data.callId);
        setCallAccepted(true);
        
        // Update otherParticipant to include responder info and maintain caller flag
        setOtherParticipant(prev => {
          console.log('📹 Updating otherParticipant. Previous:', prev, 'Responder:', data.responder);
          
          // Merge existing participant data with responder data
          const updated = {
            ...(prev || {}),
            ...(data.responder || {}),
            isCurrentUserCaller: true, // Caller is receiving acceptance
            // Ensure we have an ID
            _id: prev?._id || data.responder?._id || data.responder?.id,
            id: prev?.id || data.responder?.id || data.responder?._id
          };
          
          console.log('📹 Updated otherParticipant:', updated);
          return updated;
        });
        
        setShowVideoCall(true);
      } else {
        toast.error(`${data.responder?.fullName || 'Participant'} declined the call.`);
        setShowVideoCall(false);
        setOtherParticipant(null);
        setCallAccepted(false);
        setCurrentCallId(null);
      }
    };

    const handleCallEnded = () => {
      toast('Call ended', { icon: '📹' });
      setShowVideoCall(false);
      setOtherParticipant(null);
      setCallAccepted(false);
      setIncomingCall(null);
      setCurrentCallId(null);
    };

    socket.on('call-response-received', handleCallResponse);
    socket.on('call-ended', handleCallEnded);

    return () => {
      socket.off('call-response-received', handleCallResponse);
      socket.off('call-ended', handleCallEnded);
    };
  }, [socket]);

  // Fetch workspace data
  useEffect(() => {
    if (!workspace) {
      fetchWorkspace();
    }
  }, [projectId, applicationId]);

  const fetchWorkspace = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      console.log('🔍 Fetching workspace for project:', projectId);
      console.log('🔍 Token exists:', !!token);
      
      const response = await fetch(`http://localhost:5000/api/workspaces/project/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Workspace data received:', data);
        setWorkspace(data.data);
        
        // Fetch related data
        await Promise.all([
          fetchMilestones(data.data._id),
          fetchDeliverables(data.data._id),
          fetchFiles(data.data._id),
          fetchPayments(data.data._id)
        ]);
      } else {
        const errorData = await response.json();
        console.error('❌ Error response:', errorData);
        toast.error(errorData.message || 'Failed to fetch workspace');
      }
    } catch (error) {
      console.error('❌ Error fetching workspace:', error);
      toast.error('Failed to load workspace: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMilestones = async (workspaceId) => {
    if (skipNextMilestoneFetch) {
      console.log('🔍 Skipping milestone fetch due to recent approval');
      setSkipNextMilestoneFetch(false);
      return;
    }
    
    try {
      console.log('🔍 Fetching milestones for workspace:', workspaceId);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/workspaces/${workspaceId}/milestones`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('🔍 Milestones response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Milestones data received:', data);
        console.log('🔍 Milestones array:', data.data || data.milestones || []);
        const milestonesArray = data.data || data.milestones || [];
        setMilestones(milestonesArray);
        console.log('🔍 Milestones state updated with', milestonesArray.length, 'milestones');
      } else {
        console.error('❌ Failed to fetch milestones:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching milestones:', error);
    }
  };

  const fetchDeliverables = async (workspaceId) => {
    try {
      console.log('🔍 Fetching deliverables for workspace:', workspaceId);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/workspaces/${workspaceId}/deliverables`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('🔍 Deliverables response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Deliverables data received:', data);
        setDeliverables(data.data || data.deliverables || []);
      } else {
        console.error('❌ Failed to fetch deliverables:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching deliverables:', error);
    }
  };

  const fetchFiles = async (workspaceId) => {
    try {
      console.log('🔍 Fetching files for workspace:', workspaceId);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/workspaces/${workspaceId}/files`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('🔍 Files response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Files data received:', data);
        setFiles(data.data || data.files || []);
      } else {
        console.error('❌ Failed to fetch files:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching files:', error);
    }
  };

  const fetchPayments = async (workspaceId) => {
    try {
      console.log('🔍 Fetching payments for workspace:', workspaceId);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/workspaces/${workspaceId}/payments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('🔍 Payments response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Payments data received:', data);
        setPayments(data.data || data.payments || []);
      } else {
        console.error('❌ Failed to fetch payments:', response.status);
        // It's okay if payments endpoint doesn't exist yet
        setPayments([]);
      }
    } catch (error) {
      console.error('❌ Error fetching payments:', error);
      setPayments([]);
    }
  };

  const handleFileUpload = async (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    setUploadingFiles(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append('files', selectedFiles[i]);
      }
      formData.append('folder', 'root');
      formData.append('description', 'Workspace file upload');

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/workspaces/${workspace._id}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Files uploaded successfully!');
        // Refresh files list
        await fetchFiles(workspace._id);
        setSelectedFiles([]);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to upload files');
      }
    } catch (error) {
      console.error('❌ Error uploading files:', error);
      toast.error('Failed to upload files: ' + error.message);
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const createMilestone = async (milestoneData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/workspaces/${workspace._id}/milestones`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(milestoneData)
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Milestone created successfully!');
        await fetchMilestones(workspace._id);
        setShowMilestoneForm(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to create milestone');
      }
    } catch (error) {
      console.error('❌ Error creating milestone:', error);
      toast.error('Failed to create milestone: ' + error.message);
    }
  };

  const updateMilestone = async (milestoneId, milestoneData) => {
    try {
      console.log('🔄 Updating milestone:', milestoneId, 'with data:', milestoneData);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/workspaces/${workspace._id}/milestones/${milestoneId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(milestoneData)
      });

      console.log('🔄 Update response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Milestone update successful:', data);
        toast.success('Milestone updated successfully!');
        
        // Force refresh milestones (bypass skip mechanism)
        console.log('🔄 Refreshing milestones...');
        setSkipNextMilestoneFetch(false); // Ensure we don't skip the fetch
        await fetchMilestones(workspace._id);
        setEditingMilestone(null);
      } else {
        const errorData = await response.json();
        console.error('❌ Update failed:', errorData);
        toast.error(errorData.message || 'Failed to update milestone');
      }
    } catch (error) {
      console.error('❌ Error updating milestone:', error);
      toast.error('Failed to update milestone: ' + error.message);
    }
  };

  const handlePaymentClick = (milestone) => {
    setSelectedMilestone(milestone);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    setSelectedMilestone(null);
    
    // Refresh milestones and payments to show updated status
    if (workspace?._id) {
      await Promise.all([
        fetchMilestones(workspace._id),
        fetchPayments(workspace._id)
      ]);
    }
    
    toast.success('Payment completed successfully!');
  };

  const handleMilestoneApproval = async () => {
    if (!approvalMilestone || !approvalAction) return;

    try {
      const status = approvalAction === 'approve' ? 'approved' : 'rejected';
      const milestoneData = {
        status: status,
        reviewNotes: reviewNotes
      };

      console.log('🔍 Approving milestone:', approvalMilestone._id, 'with data:', milestoneData);

      const token = localStorage.getItem('token');
      const url = `http://localhost:5000/api/workspaces/${workspace._id}/milestones/${approvalMilestone._id}`;
      console.log('🔍 API URL:', url);
      console.log('🔍 Request payload:', JSON.stringify(milestoneData, null, 2));
      console.log('🔍 Token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(milestoneData)
      });

      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Milestone approval successful - Response data:', data);
        
        // Update the milestone in local state immediately for instant UI feedback
        flushSync(() => {
          setMilestones(prevMilestones => {
            console.log('🔍 Updating local state - Before:', prevMilestones.map(m => ({ id: m._id, title: m.title, status: m.status })));
            const updatedMilestones = prevMilestones.map(m => 
              m._id === approvalMilestone._id 
                ? { ...m, status: status, reviewNotes: reviewNotes, reviewedBy: user?.id || user?._id, approvedDate: status === 'approved' ? new Date() : m.approvedDate }
                : m
            );
            console.log('🔍 Updating local state - After:', updatedMilestones.map(m => ({ id: m._id, title: m.title, status: m.status })));
            return updatedMilestones;
          });
        });
        
        // Prevent the next milestone fetch from overriding our local state
        setSkipNextMilestoneFetch(true);
        
        // Reset the flag after re-renders complete
        setTimeout(() => {
            setSkipNextMilestoneFetch(false);
        }, 100);
        
        // Close modal and reset state
        setShowApprovalModal(false);
        setApprovalMilestone(null);
        setApprovalAction('');
        setReviewNotes('');
        
        toast.success(`Milestone ${status} successfully!`);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('❌ Milestone approval error - Response:', errorData);
        console.error('❌ Response status:', response.status);
        console.error('❌ Response statusText:', response.statusText);
        toast.error(errorData.message || 'Failed to update milestone status');
      }
    } catch (error) {
      console.error('❌ Error approving/rejecting milestone - Catch block:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      toast.error('Failed to update milestone status: ' + error.message);
    }
  };

  const openApprovalModal = (milestone, action) => {
    setApprovalMilestone(milestone);
    setApprovalAction(action);
    setReviewNotes('');
    setShowApprovalModal(true);
  };

  const submitDeliverable = async (deliverableData, files) => {
    setSubmittingDeliverable(true);
    try {
      const formData = new FormData();
      formData.append('title', deliverableData.title);
      formData.append('description', deliverableData.description);
      
      // Determine type based on content
      let deliverableType = 'other'; // default
      if (files && files.length > 0) {
        deliverableType = 'file';
      } else if (deliverableData.links && deliverableData.links.length > 0) {
        deliverableType = 'link';
      } else if (deliverableData.textContent) {
        deliverableType = 'text';
      }
      
      formData.append('type', deliverableType);
      if (deliverableData.milestoneId) {
        formData.append('milestone', deliverableData.milestoneId);
      }

      // Add files if any
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          formData.append('files', files[i]);
        }
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/workspaces/${workspace._id}/deliverables`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Deliverable submitted successfully!');
        await fetchDeliverables(workspace._id);
        setShowDeliverableForm(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to submit deliverable');
      }
    } catch (error) {
      console.error('❌ Error submitting deliverable:', error);
      toast.error('Failed to submit deliverable: ' + error.message);
    } finally {
      setSubmittingDeliverable(false);
    }
  };

  const handleFileView = (file) => {
    setSelectedFile(file);
    setShowFileViewer(true);
  };

  const closeFileViewer = () => {
    setSelectedFile(null);
    setShowFileViewer(false);
  };

  // Deliverable Review Functions
  const openDeliverableReview = (deliverable, action) => {
    setSelectedDeliverable(deliverable);
    setReviewAction(action);
    setDeliverableReviewNotes('');
    setShowDeliverableReview(true);
  };

  const closeDeliverableReview = () => {
    setShowDeliverableReview(false);
    setSelectedDeliverable(null);
    setReviewAction('');
    setDeliverableReviewNotes('');
  };

  const submitDeliverableReview = async () => {
    if (!selectedDeliverable || !reviewAction) return;
    
    try {
      setProcessingReview(true);
      const token = localStorage.getItem('token');
      
      const reviewData = {
        status: reviewAction === 'approve' ? 'approved' : 'rejected',
        reviewNotes: deliverableReviewNotes,
        rating: reviewAction === 'approve' ? 5 : null // Default good rating for approved deliverables
      };
      
      const response = await fetch(`http://localhost:5000/api/workspaces/${workspace._id}/deliverables/${selectedDeliverable._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reviewData)
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Deliverable ${reviewAction === 'approve' ? 'approved' : 'declined'} successfully!`);
        
        // Refresh deliverables list
        await fetchDeliverables(workspace._id);
        closeDeliverableReview();
        
        // If approved, also refresh milestones to show updated escrow status
        if (reviewAction === 'approve') {
          await fetchMilestones(workspace._id);
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || `Failed to ${reviewAction} deliverable`);
      }
    } catch (error) {
      console.error(`❌ Error ${reviewAction}ing deliverable:`, error);
      toast.error(`Failed to ${reviewAction} deliverable: ${error.message}`);
    } finally {
      setProcessingReview(false);
    }
  };

  // Chat Integration Functions
  const openDeliverableChat = (deliverable) => {
    setDeliverableForChat(deliverable);
    setShowDeliverableChatModal(true);
  };

  const closeDeliverableChat = () => {
    setShowDeliverableChatModal(false);
    setDeliverableForChat(null);
  };

  const sendDeliverableChatMessage = async (message) => {
    if (!deliverableForChat || !message.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      
      // Send message with deliverable context
      const messageData = {
        content: message,
        type: 'text',
        deliverableContext: {
          deliverableId: deliverableForChat._id,
          title: deliverableForChat.title,
          description: deliverableForChat.description,
          files: deliverableForChat.files || []
        }
      };
      
      const response = await fetch(`http://localhost:5000/api/chats/${workspace.chat}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });

      if (response.ok) {
        toast.success('Comment sent to chat!');
        closeDeliverableChat();
        
        // Switch to chat tab to show the message
        setActiveTab('chat');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to send comment');
      }
    } catch (error) {
      console.error('❌ Error sending deliverable comment:', error);
      toast.error('Failed to send comment: ' + error.message);
    }
  };


  const handleStartVideoCall = () => {
    console.log('🔍 DEBUG: Starting video call');
    console.log('🔍 Current user:', user);
    console.log('🔍 Workspace client:', workspace.client);
    console.log('🔍 Workspace freelancer:', workspace.freelancer);

    // Determine the other participant based on current user
    let participant = null;
    if (workspace.client && workspace.freelancer) {
      const userId = getId(user);
      const clientId = getId(workspace.client);
      const freelancerId = getId(workspace.freelancer);
      
      if (userId === clientId) {
        participant = workspace.freelancer;
      } else if (userId === freelancerId) {
        participant = workspace.client;
      }
    }
    if (!participant) {
      console.error('❌ Could not identify the other participant');
      toast.error('Could not identify the other participant');
      return;
    }
    
    // Additional safety check: prevent calling yourself
    if (getId(participant) === getId(user)) {
      console.error('❌ Attempted to call yourself');
      toast.error('Cannot call yourself');
      return;
    }
    if (!isUserOnline(getId(participant))) {
      toast.warning(`${participant.fullName} is currently offline. They will receive a notification about the call.`);
    }
    // For caller: store participant info and mark that current user is caller
    const participantWithFlag = {
      ...participant,
      isCurrentUserCaller: true // Current user is initiating the call
    };
    console.log('📹 Setting otherParticipant for caller:', participantWithFlag);
    setOtherParticipant(participantWithFlag);
    setCallAccepted(false);
    setShowVideoCall(false); // Wait for acceptance
    // Emit video call initiation through socket
    if (socket) {
      console.log('📹 Sending call request from:', getId(user), 'to:', getId(participant));
      socket.emit('video-call-request', {
        workspaceId: workspace._id,
        fromUser: user,
        toUser: participant,
        projectTitle: workspace.project?.title
      });
    }
    toast.success(`Calling ${participant.fullName}...`);
  };

  // Accept/decline handlers for incoming call
  const handleAcceptCall = () => {
    if (socket && incomingCall) {
      console.log('📹 Accepting call from:', incomingCall.fromUser.fullName);
      setCurrentCallId(incomingCall.callId);
      socket.emit('video-call-response', {
        callId: incomingCall.callId,
        accepted: true,
        responder: user,
        callerId: getId(incomingCall.fromUser),
        workspaceId: incomingCall.workspaceId
      });
      setCallAccepted(true);
      setShowVideoCall(true);
      // For receiver: store caller info and mark that current user is NOT the caller
      setOtherParticipant({
        ...incomingCall.fromUser,
        isCurrentUserCaller: false // Current user is receiving the call
      });
      setIncomingCall(null);
      console.log('📹 Video call modal should now be open');
    }
  };
  const handleDeclineCall = () => {
    if (socket && incomingCall) {
      socket.emit('video-call-response', {
        callId: incomingCall.callId,
        accepted: false,
        responder: user,
        callerId: getId(incomingCall.fromUser)
      });
      setCallAccepted(false);
      setShowVideoCall(false);
      setOtherParticipant(null);
      setIncomingCall(null);
    }
  };

  const closeVideoCall = () => {
    console.log('📹 Closing video call');
    setShowVideoCall(false);
    setOtherParticipant(null);
    setCurrentCallId(null);
  };

  const handleFileDownload = (file) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to download files');
        return;
      }

      // Create download URL using workspace ID
      const downloadUrl = `http://localhost:5000/api/files/workspaces/${workspace._id}/download/${file._id || file.id}`;
      
      // Create a temporary anchor element and trigger download
      const link = document.createElement('a');
      link.href = `${downloadUrl}?token=${token}`;
      link.target = '_blank';
      link.download = file.filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Download started!');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  if (loading) {
    console.log('🔍 WorkspaceInterface: Currently loading...');
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!workspace) {
    console.log('🔍 WorkspaceInterface: No workspace data available');
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <p className="text-red-600 mb-4">Failed to load workspace</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  console.log('🔍 WorkspaceInterface: Rendering full workspace interface');
  console.log('🔍 WorkspaceInterface: Workspace data:', workspace);
  console.log('🔍 WorkspaceInterface: User data:', user);

  const isFreelancer = user?.userType === 'freelancer' || getId(user) === getId(workspace.freelancer);
  const isClient = user?.userType === 'client' || getId(user) === getId(workspace.client);
  
  console.log('🔍 WorkspaceInterface: isFreelancer:', isFreelancer, 'isClient:', isClient);

  const tabs = [
    { id: 'chat', name: 'Chat', icon: ChatBubbleLeftRightIcon },
    { id: 'files', name: 'Files', icon: FolderIcon },
    { id: 'milestones', name: 'Milestones', icon: FlagIcon },
    { id: 'deliverables', name: 'Deliverables', icon: ArchiveBoxIcon },
    { id: 'payments', name: isFreelancer ? 'Payment History' : 'Payments', icon: CreditCardIcon }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-7xl h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Project Workspace</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Status: <span className="capitalize font-medium">{workspace?.status || 'Unknown'}</span></span>
            {workspace.status === 'active' && (
              <button
                onClick={handleStartVideoCall}
                className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                title="Start video call"
              >
                <VideoCameraIcon className="w-4 h-4" />
                <span>Video Call</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              aria-label="Close workspace"
            >
              ×
            </button>
          </div>
        </div>

        {/* Compact Info Bar */}
        <div className="px-3 py-2 border-b bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-700">
            {/* Show relevant person based on user role */}
            {isClient ? (
              /* Client sees Freelancer info */
              <div className="flex items-center gap-2">
                <span className="font-medium">Freelancer:</span>
                <span>{workspace.freelancer?.fullName || '—'}</span>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${
                    isUserOnline(getId(workspace.freelancer)) ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                  <span className="text-xs text-gray-500">
                    {isUserOnline(getId(workspace.freelancer)) ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            ) : (
              /* Freelancer sees Client info */
              <div className="flex items-center gap-2">
                <span className="font-medium">Client:</span>
                <span>{workspace.client?.fullName || '—'}</span>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${
                    isUserOnline(getId(workspace.client)) ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                  <span className="text-xs text-gray-500">
                    {isUserOnline(getId(workspace.client)) ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            )}
            {/* Project title (truncated) */}
            <div className="flex items-center gap-2 text-xs">
              <span className="truncate max-w-xs">{workspace.project?.title || 'Project'}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {tabs.map(tab => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <IconComponent className="w-5 h-5 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'chat' && (
            <div className="h-full">
              {workspace.chatId ? (
                <ChatInterface
                  chatId={workspace.chatId}
                  isOpen={true}
                  onClose={() => {}} // Don't close since it's embedded
                  user={user}
                  isWorkspaceChat={true}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <ChatBubbleLeftRightIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">Chat Not Available</h3>
                    <p>No chat session found for this workspace.</p>
                    <p className="text-xs mt-2 text-red-500">Chat ID: {workspace.chatId || 'Not found'}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'files' && (
            <div className="h-full p-6 overflow-y-auto">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Shared Files</h3>
                {files.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {files.map((file, index) => (
                      <div 
                        key={index} 
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="relative">
                            <FolderIcon className="w-8 h-8 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.filename || `File ${index + 1}`}
                            </p>
                            <p className="text-xs text-gray-500">
                              {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Unknown size'}
                            </p>
                            <p className="text-xs text-gray-400">
                              {file.uploadDate ? new Date(file.uploadDate).toLocaleDateString() : 'Unknown date'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleFileView(file)}
                            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-sm"
                          >
                            <EyeIcon className="w-4 h-4" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => handleFileDownload(file)}
                            className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-12">
                    <FolderIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">No Files Shared</h3>
                    <p>Files shared in this workspace will appear here.</p>
                    <p className="mt-4 text-xs text-gray-500 max-w-3xl mx-auto">
                      Supported: JPEG, JPG, PNG, GIF, WebP, PDF, DOC, DOCX, TXT, CSV, XLS, XLSX, PPT, PPTX, ZIP, RAR, MP4, MOV, AVI • Max 10MB per file • Up to 5 files per upload
                    </p>
                  </div>
                )}
              </div>
              
              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <FolderIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-2">
                  {uploadingFiles ? 'Uploading files...' : 'Drop files here or click to browse'}
                </p>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  disabled={uploadingFiles}
                />
                <label
                  htmlFor="file-upload"
                  className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer inline-block ${
                    uploadingFiles ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {uploadingFiles ? 'Uploading...' : 'Choose Files'}
                </label>
                {selectedFiles.length > 0 && (
                  <div className="mt-3 text-sm text-gray-600">
                    Selected: {selectedFiles.map(f => f.name).join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'milestones' && (
            <div className="h-full p-6 overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-semibold">Project Milestones</h3>
                  {isFreelancer && (
                    <p className="text-sm text-gray-600 mt-1">
                      Create milestones with deliverables and payment schedule for client approval
                    </p>
                  )}
                  {isClient && (
                    <div className="text-sm text-gray-600 mt-1">
                      <p>Review and approve milestones created by the freelancer</p>
                      <p className="text-xs mt-1 text-blue-600">
                        💡 You'll pay for each milestone after the freelancer delivers and you approve it
                      </p>
                    </div>
                  )}
                </div>
                {isFreelancer && (
                  <button
                    onClick={() => setShowMilestoneForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Milestone
                  </button>
                )}
              </div>
              
              {milestones.length > 0 ? (
                <div className="space-y-4">
                  {milestones.map((milestone, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{milestone.title}</h4>
                          <p className="text-gray-600 text-sm mt-1">{milestone.description}</p>
                          <div className="flex flex-col space-y-1 mt-3 text-sm text-gray-500">
                            <div className="flex items-center space-x-4">
                              <span className="font-medium">Amount: ₹{milestone.amount}</span>
                              <span>Delivery Due: {new Date(milestone.dueDate).toLocaleDateString()}</span>
                            </div>
                            {milestone.paymentDueDate && (
                              <div className="flex items-center space-x-4">
                                <span className={`${isClient ? 'font-medium text-blue-600' : ''}`}>
                                  Payment Due: {new Date(milestone.paymentDueDate).toLocaleDateString()}
                                  {isClient && milestone.status === 'approved' && ' (Your responsibility)'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {isFreelancer && milestone.status !== 'approved' && milestone.status !== 'paid' && milestone.status !== 'payment-overdue' && (
                            <button
                              onClick={() => {
                                console.log('✏️ Edit button clicked for milestone:', milestone);
                                setEditingMilestone(milestone);
                              }}
                              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded hover:bg-blue-50"
                            >
                              Edit
                            </button>
                          )}
                          {isFreelancer && (milestone.status === 'approved' || milestone.status === 'paid' || milestone.status === 'payment-overdue') && (
                            <span className="px-3 py-1 text-sm text-gray-500 border border-gray-300 rounded bg-gray-50" title="Cannot edit approved milestones">
                              Locked
                            </span>
                          )}
                          {/* Milestone approval buttons for clients */}
                          {isClient && (milestone.status === 'review' || milestone.status === 'completed' || milestone.status === 'pending') && milestone.status !== 'approved' && milestone.status !== 'rejected' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openApprovalModal(milestone, 'approve')}
                                className="px-3 py-1 text-sm text-green-600 hover:text-green-800 border border-green-300 rounded hover:bg-green-50"
                              >
                                ✅ Approve
                              </button>
                              <button
                                onClick={() => openApprovalModal(milestone, 'reject')}
                                className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50"
                              >
                                ❌ Reject
                              </button>
                            </div>
                          )}
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            milestone.status === 'completed' ? 'bg-green-100 text-green-800' :
                            milestone.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                            milestone.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            milestone.status === 'review' ? 'bg-orange-100 text-orange-800' :
                            milestone.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            milestone.status === 'paid' ? 'bg-green-100 text-green-800' :
                            milestone.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {
                              milestone.status === 'pending' ? 'Awaiting Client Approval' :
                              milestone.status === 'approved' ? 'Approved - Ready to Start' :
                              milestone.status === 'in-progress' ? 'In Progress' :
                              milestone.status === 'review' ? 'Under Client Review' :
                              milestone.status === 'completed' ? 'Completed' :
                              milestone.status === 'rejected' ? 'Needs Revision' :
                              milestone.status === 'paid' ? 'Paid' :
                              milestone.status || 'Draft'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <FlagIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No Milestones Yet</h3>
                  <p>Project milestones will be created and tracked here.</p>
                  {isFreelancer && (
                    <p className="text-sm text-blue-600 mt-2">As a freelancer, you can create project milestones</p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'deliverables' && (
            <div className="h-full overflow-y-auto">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold">Project Deliverables</h3>
                {isFreelancer && (
                  <button
                    onClick={() => setShowDeliverableForm(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    disabled={submittingDeliverable}
                  >
                    {submittingDeliverable ? 'Submitting...' : 'Submit Deliverable'}
                  </button>
                )}
              </div>

              {/* Deliverable Types Info for Freelancers */}
              {isFreelancer && (
                <div className="p-3 bg-blue-50 border-b">
                  <div className="text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-blue-800 mb-2">📦 Deliverable Types Supported:</h4>
                        <ul className="text-gray-700 space-y-1 text-xs">
                          <li>• <strong>Compressed folders</strong> (.zip, .rar)</li>
                          <li>• <strong>Links</strong> (staging URL, Figma, GitHub, etc.)</li>
                          <li>• <strong>Documents</strong> (PDFs, docs, screenshots, mockups)</li>
                          <li>• <strong>Videos</strong> (demos, walkthroughs)</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-orange-800 mb-2">📏 File Requirements:</h4>
                        <ul className="text-gray-700 space-y-1 text-xs">
                          <li>• <strong>Max file size:</strong> 10MB per file</li>
                          <li>• <strong>Max files per upload:</strong> 5 files</li>
                          <li>• <strong>Supported formats:</strong> JPEG, PNG, PDF, DOC, DOCX, ZIP, RAR, MP4, MOV, AVI</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-6">
                {deliverables.length > 0 ? (
                <div className="space-y-4">
                  {deliverables.map((deliverable, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{deliverable.title}</h4>
                          <p className="text-gray-600 text-sm mt-1">{deliverable.description}</p>
                          <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                            <span>Submitted: {new Date(deliverable.submissionDate).toLocaleDateString()}</span>
                            {deliverable.milestone && (
                              <span>Milestone: {deliverable.milestone.title}</span>
                            )}
                          </div>
                          
                          {/* Deliverable Files */}
                          {deliverable.files && deliverable.files.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-medium text-gray-700 mb-2">Attached Files:</p>
                              <div className="flex flex-wrap gap-2">
                                {deliverable.files.map((file, fileIndex) => (
                                  <div key={fileIndex} className="flex items-center space-x-1">
                                    <button
                                      onClick={() => handleFileView(file)}
                                      className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-sm"
                                    >
                                      <EyeIcon className="w-4 h-4 mr-1" />
                                      {file.filename || `File ${fileIndex + 1}`}
                                    </button>
                                    <button
                                      onClick={() => handleFileDownload(file)}
                                      className="inline-flex items-center px-2 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors text-sm"
                                      title="Download file"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                      </svg>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            deliverable.status === 'approved' ? 'bg-green-100 text-green-800' :
                            deliverable.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {deliverable.status || 'Pending Review'}
                          </span>
                          
                          {/* Client Review Actions */}
                          {!isFreelancer && (deliverable.status === 'pending' || deliverable.status === 'submitted' || !deliverable.status) && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openDeliverableReview(deliverable, 'approve')}
                                className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => openDeliverableReview(deliverable, 'decline')}
                                className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
                              >
                                ✗ Decline
                              </button>
                              <button
                                onClick={() => openDeliverableChat(deliverable)}
                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                💬 Comment
                              </button>
                            </div>
                          )}
                          
                          {/* Review Status Info */}
                          {deliverable.reviewDate && (
                            <div className="text-xs text-gray-500 text-right">
                              <div>Reviewed: {new Date(deliverable.reviewDate).toLocaleDateString()}</div>
                              {deliverable.reviewNotes && (
                                <div className="mt-1 max-w-48 text-right">
                                  "{deliverable.reviewNotes}"
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <ArchiveBoxIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No Deliverables Yet</h3>
                  <p>Project deliverables will be submitted and reviewed here.</p>
                </div>
              )}
              </div>
            </div>
          )}

          {activeTab === 'payments' && isClient && (
            <div className="h-full p-6 overflow-y-auto">
              <h3 className="text-lg font-semibold mb-6">Payment Management</h3>
              
              {(() => {
                const now = new Date();
                const payableMilestones = milestones.filter(m => {
                  // Exclude already paid milestones
                  if (m.paymentStatus === 'completed' || m.status === 'paid') return false;
                  
                  if (m.status === 'approved') return true;
                  if (m.paymentDueDate) {
                    const dueDate = new Date(m.paymentDueDate);
                    return now >= dueDate;
                  }
                  return false;
                });
                
                const paidMilestones = milestones.filter(m => 
                  m.paymentStatus === 'completed' || m.status === 'paid'
                );
                return (
                  <div>
                    {payableMilestones.length > 0 && (
                      <div className="space-y-4 mb-8">
                        <h4 className="font-medium text-gray-700">Milestones Ready for Payment</h4>
                        {payableMilestones.map((milestone, index) => (
                          <div key={index} className="border border-green-200 rounded-lg p-4 bg-green-50">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-semibold">{milestone.title}</h5>
                                <p className="text-gray-600 text-sm mt-1">{milestone.description}</p>
                                <p className="text-green-600 text-sm mt-2">
                                  <strong>Amount Due:</strong> ₹{milestone.amount}
                                </p>
                                {milestone.paymentDueDate && (
                                  <p className="text-gray-500 text-xs mt-1">
                                    Payment Due: {new Date(milestone.paymentDueDate).toLocaleDateString()}
                                  </p>
                                )}
                                <p className="text-xs mt-1">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    milestone.status === 'approved' 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {milestone.status === 'approved' ? 'Approved' : 'Payment Due'}
                                  </span>
                                </p>
                              </div>
                              <button
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                onClick={() => handlePaymentClick(milestone)}
                              >
                                Pay Now
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {paidMilestones.length > 0 && (
                      <div className="space-y-4 mb-8">
                        <h4 className="font-medium text-gray-700">Completed Payments</h4>
                        {paidMilestones.map((milestone, index) => (
                          <div key={`paid-${index}`} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-semibold text-gray-800">{milestone.title}</h5>
                                <p className="text-gray-600 text-sm mt-1">{milestone.description}</p>
                                <p className="text-green-600 text-sm mt-2">
                                  <strong>Amount Paid:</strong> ₹{milestone.amount}
                                </p>
                                {milestone.paidDate && (
                                  <p className="text-gray-500 text-xs mt-1">
                                    Paid on: {new Date(milestone.paidDate).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Paid
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {payableMilestones.length === 0 && paidMilestones.length === 0 && (
                      <div className="text-center text-gray-500 py-12">
                        <CreditCardIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium mb-2">No Payments</h3>
                        <p>Milestones ready for payment will appear here when approved or payment due date arrives.</p>
                      </div>
                    )}
                  </div>
                );
          })()}
            </div>
          )}

          {activeTab === 'payments' && isFreelancer && (
            <div className="h-full p-6 overflow-y-auto">
              <h3 className="text-lg font-semibold mb-6">Payment History</h3>
              
              {payments.length > 0 ? (
                <div className="space-y-4">
                  {payments.map((payment, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-lg">₹{payment.amount}</h4>
                            {payment.milestone?.escrowStatus === 'active' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                🔒 Held in Escrow
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mt-1">
                            {payment.milestone?.title || 'Payment'}
                          </p>
                          <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                            <span>Date: {new Date(payment.paidAt || payment.createdAt).toLocaleDateString()}</span>
                            <span>Method: {payment.paymentMethod || 'Razorpay'}</span>
                          </div>
                          {payment.milestone?.escrowStatus === 'active' && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center text-sm text-blue-800">
                                <span className="text-blue-600 mr-2">🔒</span>
                                <div>
                                  <p className="font-medium">Funds held in escrow</p>
                                  <p className="text-xs text-blue-600 mt-1">
                                    Payment will be released after work delivery is approved by admin
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          payment.status === 'completed' && payment.milestone?.escrowStatus === 'active' 
                            ? 'bg-blue-100 text-blue-800' :
                          payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          payment.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                          payment.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {payment.milestone?.escrowStatus === 'active' ? 'In Escrow' : 
                           payment.status || 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <CreditCardIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No Payment History</h3>
                  <p>Your payment history will appear here once milestones are approved and paid.</p>
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-700 mb-3">Pending Payments</h4>
                    {milestones.filter(m => m.status === 'approved' && !m.isPaid).length > 0 ? (
                      <div className="text-sm text-orange-600">
                        {milestones.filter(m => m.status === 'approved' && !m.isPaid).length} milestone(s) approved, awaiting payment
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">No pending payments</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>


      </div>

      {/* Milestone Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {approvalAction === 'approve' ? 'Approve Milestone' : 'Reject Milestone'}
              </h3>
              <button 
                onClick={() => setShowApprovalModal(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-900">{approvalMilestone?.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{approvalMilestone?.description}</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span>Amount: ₹{approvalMilestone?.amount}</span>
                <span>Due: {approvalMilestone?.dueDate ? new Date(approvalMilestone.dueDate).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Notes {approvalAction === 'reject' ? '*' : '(Optional)'}
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder={`Add ${approvalAction === 'approve' ? 'approval' : 'rejection'} notes...`}
                required={approvalAction === 'reject'}
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMilestoneApproval}
                className={`flex-1 px-4 py-2 text-white rounded-md ${
                  approvalAction === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                disabled={approvalAction === 'reject' && !reviewNotes.trim()}
              >
                {approvalAction === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Milestone Form Modal */}
      {(showMilestoneForm || editingMilestone) && (
        <MilestoneForm
          milestone={editingMilestone}
          onSubmit={editingMilestone ? 
            (data) => updateMilestone(editingMilestone._id, data) : 
            createMilestone
          }
          onClose={() => {
            setShowMilestoneForm(false);
            setEditingMilestone(null);
          }}
        />
      )}

      {/* Deliverable Form Modal */}
      {showDeliverableForm && (
        <DeliverableForm
          milestones={milestones}
          onSubmit={submitDeliverable}
          onClose={() => setShowDeliverableForm(false)}
          submitting={submittingDeliverable}
        />
      )}

      {/* File Viewer Modal */}
      <FileViewer
        file={selectedFile}
        isOpen={showFileViewer}
        onClose={closeFileViewer}
      />

      {/* Incoming Video Call Popup */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center max-w-sm w-full">
            <div className="mb-4">
              <span className="inline-block bg-blue-100 text-blue-700 rounded-full px-3 py-1 text-sm font-semibold mb-2">Incoming Video Call</span>
              <h3 className="text-lg font-bold mb-2">{incomingCall.fromUser?.fullName || 'Someone'} is calling you</h3>
              <p className="text-gray-600 mb-2">Project: {incomingCall.projectTitle || 'Workspace'}</p>
            </div>
            <div className="flex justify-center space-x-4">
              <button onClick={handleAcceptCall} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Accept</button>
              <button onClick={handleDeclineCall} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Decline</button>
            </div>
          </div>
        </div>
      )}
      {/* Video Call Modal */}
      {showVideoCall && workspace?._id && otherParticipant && (
        <VideoCall
          isOpen={showVideoCall}
          onClose={closeVideoCall}
          workspaceId={workspace._id}
          participantInfo={otherParticipant}
          callId={currentCallId}
        />
      )}
      {/* Show error if video call state is invalid */}
      {showVideoCall && (!workspace?._id || !otherParticipant) && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-8 max-w-md text-center">
            <h3 className="text-xl font-bold text-white mb-4">Call Setup Error</h3>
            <p className="text-gray-300 mb-6">
              Unable to start video call. Missing required information.
            </p>
            <button
              onClick={closeVideoCall}
              className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedMilestone && (
        <PaymentModal
          milestone={selectedMilestone}
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedMilestone(null);
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Deliverable Review Modal */}
      {showDeliverableReview && selectedDeliverable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-semibold">
                  {reviewAction === 'approve' ? 'Approve' : 'Decline'} Deliverable
                </h2>
                <button 
                  onClick={closeDeliverableReview}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Deliverable Preview */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-lg mb-2">{selectedDeliverable.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{selectedDeliverable.description}</p>
                
                {/* Files Preview */}
                {selectedDeliverable.files && selectedDeliverable.files.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Attached Files:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedDeliverable.files.map((file, index) => (
                        <div key={index} className="flex items-center space-x-1">
                          <button
                            onClick={() => handleFileView(file)}
                            className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-sm"
                          >
                            <EyeIcon className="w-4 h-4 mr-1" />
                            {file.filename || `File ${index + 1}`}
                          </button>
                          <a
                            href={`http://localhost:5000${file.url}`}
                            download={file.originalName || file.filename}
                            className="inline-flex items-center px-2 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors text-sm"
                            title="Download file"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Submission Info */}
                <div className="mt-3 text-xs text-gray-500">
                  <div>Submitted: {new Date(selectedDeliverable.submissionDate).toLocaleString()}</div>
                  {selectedDeliverable.submissionNotes && (
                    <div className="mt-1">
                      <strong>Notes:</strong> {selectedDeliverable.submissionNotes}
                    </div>
                  )}
                </div>
              </div>

              {/* Review Form */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {reviewAction === 'approve' ? 'Approval Comments' : 'Reason for Decline'} (Optional)
                </label>
                <textarea
                  value={deliverableReviewNotes}
                  onChange={(e) => setDeliverableReviewNotes(e.target.value)}
                  className="w-full h-32 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={
                    reviewAction === 'approve' 
                      ? "Great work! The deliverable meets all requirements..."
                      : "Please revise the following items..."
                  }
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeDeliverableReview}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  disabled={processingReview}
                >
                  Cancel
                </button>
                <button
                  onClick={submitDeliverableReview}
                  className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
                    reviewAction === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  } disabled:opacity-50`}
                  disabled={processingReview}
                >
                  {processingReview ? 'Processing...' : (reviewAction === 'approve' ? 'Approve Deliverable' : 'Decline Deliverable')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deliverable Chat Integration Modal */}
      {showDeliverableChat && deliverableForChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-semibold">Comment on Deliverable</h2>
                <button 
                  onClick={closeDeliverableChat}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Deliverable Context (WhatsApp-style) */}
              <div className="mb-4 p-3 bg-gray-100 border-l-4 border-blue-500 rounded-lg opacity-75">
                <div className="text-sm text-gray-600 mb-1">💼 Deliverable</div>
                <div className="font-medium text-sm">{deliverableForChat.title}</div>
                <div className="text-xs text-gray-500 mt-1">{deliverableForChat.description}</div>
                {deliverableForChat.files && deliverableForChat.files.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    📎 {deliverableForChat.files.length} file(s) attached
                  </div>
                )}
              </div>

              {/* Comment Form */}
              <DeliverableChatForm 
                onSendMessage={sendDeliverableChatMessage}
                onCancel={closeDeliverableChat}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Milestone Form Component
const MilestoneForm = ({ milestone, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    title: milestone?.title || '',
    description: milestone?.description || '',
    amount: milestone?.amount || '',
    dueDate: milestone?.dueDate ? new Date(milestone.dueDate).toISOString().split('T')[0] : '',
    paymentDueDate: milestone?.paymentDueDate ? new Date(milestone.paymentDueDate).toISOString().split('T')[0] : '',
    requirements: milestone?.requirements || []
  });

  // Update form data when milestone prop changes
  useEffect(() => {
    if (milestone) {
      console.log('📝 MilestoneForm: Loading milestone data:', milestone);
      setFormData({
        title: milestone.title || '',
        description: milestone.description || '',
        amount: milestone.amount || '',
        dueDate: milestone.dueDate ? new Date(milestone.dueDate).toISOString().split('T')[0] : '',
        paymentDueDate: milestone.paymentDueDate ? new Date(milestone.paymentDueDate).toISOString().split('T')[0] : '',
        requirements: milestone.requirements || []
      });
      console.log('📝 MilestoneForm: Form data set:', {
        title: milestone.title || '',
        description: milestone.description || '',
        amount: milestone.amount || ''
      });
    }
  }, [milestone]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.amount || !formData.dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {milestone ? 'Edit Milestone' : 'Create Milestone'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (₹) *
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date *
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Due Date
            </label>
            <input
              type="date"
              value={formData.paymentDueDate}
              onChange={(e) => setFormData({...formData, paymentDueDate: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {milestone ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Deliverable Form Component
const DeliverableForm = ({ milestones, onSubmit, onClose, submitting }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'regular',
    milestoneId: ''
  });
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }
    onSubmit(formData, selectedFiles);
  };

  const handleFileSelect = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Submit Deliverable</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              required
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Related Milestone
            </label>
            <select
              value={formData.milestoneId}
              onChange={(e) => setFormData({...formData, milestoneId: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={submitting}
            >
              <option value="">Select milestone (optional)</option>
              {milestones.map((milestone) => (
                <option key={milestone._id} value={milestone._id}>
                  {milestone.title} - ₹{milestone.amount}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attach Files
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={submitting}
            />
            {selectedFiles.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                Selected files: {selectedFiles.map(f => f.name).join(', ')}
              </div>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Deliverable'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Helper component for deliverable chat form
const DeliverableChatForm = ({ onSendMessage, onCancel }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setSending(true);
    try {
      await onSendMessage(message);
      setMessage('');
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Comment
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full h-32 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Add your comments about this deliverable..."
          required
        />
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          disabled={sending}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          disabled={sending || !message.trim()}
        >
          {sending ? 'Sending...' : '💬 Send to Chat'}
        </button>
      </div>
    </form>
  );
};

export default WorkspaceInterfaceFixed;