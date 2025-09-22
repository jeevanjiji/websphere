import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ChatInterface from './ChatInterface';
import MilestoneStatusManager from './MilestoneStatusManager';
import MilestoneTemplateModal from './MilestoneTemplateModal';
import { PaymentModal } from './PaymentModal';
import { toast } from 'react-hot-toast';
import { 
  ChatBubbleLeftRightIcon, 
  FolderIcon, 
  FlagIcon, 
  ArchiveBoxIcon,
  CreditCardIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const WorkspaceInterface = ({ projectId, applicationId, onClose }) => {
  console.log('🔍 WorkspaceInterface: Component rendering with props:', { projectId, applicationId });
  
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [milestones, setMilestones] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [files, setFiles] = useState([]);
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);

  // Fetch workspace data
  useEffect(() => {
    fetchWorkspace();
  }, [projectId, applicationId]);

  const fetchWorkspace = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      console.log('🔍 Fetching workspace for project:', projectId);
      console.log('🔍 Application ID:', applicationId);
      console.log('🔍 Token exists:', !!token);
      
      // First, check if workspace exists or create it
      const response = await fetch(`http://localhost:5000/api/workspaces/project/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Workspace data received:', data);
        setWorkspace(data.data);
        
        // Fetch related data
        await Promise.all([
          fetchMilestones(data.data._id),
          fetchDeliverables(data.data._id),
          fetchFiles(data.data._id)
        ]);
      } else if (response.status === 404) {
        console.error('❌ Workspace not found for project:', projectId);
        // Workspace not found - this shouldn't happen if application was properly accepted
        toast.error('Workspace not found. Please ensure the application was properly accepted.');
        throw new Error('Workspace not found');
      } else {
        const errorData = await response.json();
        console.error('❌ Error response:', errorData);
        throw new Error(errorData.message || 'Failed to fetch workspace');
      }
    } catch (error) {
      console.error('❌ Error fetching workspace:', error);
      toast.error('Failed to load workspace: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMilestones = async (workspaceId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/workspaces/${workspaceId}/milestones`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMilestones(data.data);
      }
    } catch (error) {
      console.error('Error fetching milestones:', error);
    }
  };

  const fetchDeliverables = async (workspaceId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/workspaces/${workspaceId}/deliverables`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDeliverables(data.data);
      }
    } catch (error) {
      console.error('Error fetching deliverables:', error);
    }
  };

  const fetchFiles = async (workspaceId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/workspaces/${workspaceId}/files`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFiles(data.data);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const handleFileUpload = async (files) => {
    if (!workspace) return;

    // Validate files before upload
    const maxFileSize = 10 * 1024 * 1024; // 10MB (to match Cloudinary's limit)
    const maxFiles = 5;
    const allowedTypes = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'txt', 'zip', 'rar', 'mp4', 'mov', 'avi', 'xls', 'xlsx', 'ppt', 'pptx', 'csv'];

    // Check file count
    if (files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate each file
    for (let file of files) {
      // Check file size
      if (file.size > maxFileSize) {
        toast.error(`File "${file.name}" is too large. Maximum size is 10MB.`);
        return;
      }

      // Check file type
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (!allowedTypes.includes(fileExtension)) {
        toast.error(`File type ".${fileExtension}" is not allowed. Supported types: ${allowedTypes.join(', ')}`);
        return;
      }
    }

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    try {
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
        setFiles(prev => [...data.data, ...prev]);
        toast.success('Files uploaded successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload files');
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error(error.message || 'Failed to upload files');
    }
  };

  const createMilestone = async (milestoneData) => {
    if (!workspace) return;

    try {
      console.log('Creating milestone with data:', milestoneData);
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
        setMilestones(prev => [...prev, data.data]);
        toast.success('Milestone created successfully!');
        return data.data;
      } else {
        const errorData = await response.json();
        console.error('Milestone creation error:', errorData);
        toast.error(errorData.message || 'Failed to create milestone');
        throw new Error(errorData.message || 'Failed to create milestone');
      }
    } catch (error) {
      console.error('Error creating milestone:', error);
      toast.error('Failed to create milestone');
    }
  };

  // Payment functions
  const handlePayMilestone = (milestone) => {
    setSelectedMilestone(milestone);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setSelectedMilestone(null);
    fetchMilestones(workspace._id); // Refresh milestones
    toast.success('Payment completed successfully!');
  };

  const handlePaymentClose = () => {
    setShowPaymentModal(false);
    setSelectedMilestone(null);
  };

  const handleApproveMilestone = async (milestoneId, status) => {
    try {
      const response = await fetch(`http://localhost:5000/api/workspaces/${workspace._id}/milestones/${milestoneId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        await fetchMilestones(workspace._id); // Refresh milestones
        toast.success(`Milestone ${status === 'approved' ? 'approved' : 'rejected'} successfully!`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update milestone status');
      }
    } catch (error) {
      console.error('Error updating milestone status:', error);
      toast.error('Failed to update milestone status');
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
  console.log('🔍 Workspace data:', workspace);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Project Workspace</h2>
            <p className="text-gray-600">
              Status: <span className="capitalize font-medium">{workspace.status}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {[
            { id: 'chat', label: 'Chat', icon: ChatBubbleLeftRightIcon },
            { id: 'files', label: 'Files', icon: FolderIcon },
            { id: 'milestones', label: 'Milestones', icon: FlagIcon },
            { id: 'deliverables', label: 'Deliverables', icon: ArchiveBoxIcon },
            ...(isWorkspaceClient ? [{ id: 'payments', label: 'Payments', icon: CreditCardIcon }] : [])
          ].map(tab => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-3 font-medium ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <IconComponent className="w-5 h-5 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'chat' && (
            <ChatInterface 
              chatId={workspace.chatId}
              participants={[workspace.client, workspace.freelancer]}
              isWorkspaceChat={true}
              isOpen={true}
              user={user}
            />
          )}

          {activeTab === 'files' && (
            <FilesTab 
              files={files}
              workspace={workspace}
              onFileUpload={handleFileUpload}
              onRefresh={() => fetchFiles(workspace._id)}
            />
          )}

          {activeTab === 'milestones' && (
            <MilestonesTab 
              milestones={milestones}
              workspace={workspace}
              user={user}
              onCreate={createMilestone}
              onRefresh={() => fetchMilestones(workspace._id)}
            />
          )}

          {activeTab === 'deliverables' && (
            <DeliverablesTab 
              deliverables={deliverables}
              workspace={workspace}
              milestones={milestones}
              user={user}
              onRefresh={() => fetchDeliverables(workspace._id)}
            />
          )}

          {activeTab === 'payments' && isWorkspaceClient && (
            <PaymentsTab 
              milestones={milestones}
              workspace={workspace}
              user={user}
              onPaymentSuccess={handlePaymentSuccess}
              onRefresh={() => fetchMilestones(workspace._id)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Files Tab Component
const FilesTab = ({ files, workspace, onFileUpload, onRefresh }) => {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileUpload(files);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      onFileUpload(files);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="h-full flex flex-col">
      {/* Upload Area */}
      <div
        className={`m-4 p-8 border-2 border-dashed rounded-lg text-center ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-4xl mb-4">📎</div>
        <p className="text-gray-600 mb-4">
          Drag and drop files here, or click to select files
        </p>
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
        >
          Select Files
        </label>
      </div>

      {/* Files List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 gap-4">
          {files.map(file => (
            <div key={file._id} className="border rounded-lg p-4 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="text-2xl mr-3">
                    {file.category === 'image' ? '🖼️' :
                     file.category === 'document' ? '📄' :
                     file.category === 'video' ? '🎥' :
                     file.category === 'audio' ? '🎵' : '📁'}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{file.originalName}</h4>
                    <p className="text-sm text-gray-600">
                      {formatFileSize(file.size)} • 
                      Uploaded by {file.uploadedBy.fullName} • 
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </p>
                    {file.description && (
                      <p className="text-sm text-gray-500 mt-1">{file.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href={`http://localhost:5000/api/files/workspaces/${workspace._id}/download/${file._id}`}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    download
                  >
                    Download
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {files.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No files uploaded yet
          </div>
        )}
      </div>
    </div>
  );
};

// Milestones Tab Component
const MilestonesTab = ({ milestones, workspace, user, onCreate, onRefresh }) => {
  console.log('MilestonesTab rendering with:', { milestones, workspace, user });
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    amount: '',
    requirements: ['']
  });

  // Early return if required props are missing
  if (!workspace || !user) {
    console.log('MilestonesTab: Missing required props', { workspace, user });
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            Loading milestones...
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const milestoneData = {
      ...formData,
      requirements: formData.requirements.filter(req => req.trim()),
      amount: parseFloat(formData.amount)
    };

    const result = await onCreate(milestoneData);
    if (result) {
      setShowCreateForm(false);
      setFormData({
        title: '',
        description: '',
        dueDate: '',
        amount: '',
        requirements: ['']
      });
    }
  };

  const addRequirement = () => {
    setFormData(prev => ({
      ...prev,
      requirements: [...prev.requirements, '']
    }));
  };

  const removeRequirement = (index) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const updateRequirement = (index, value) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.map((req, i) => i === index ? value : req)
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-purple-100 text-purple-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleApplyTemplate = async (templateMilestones) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/workspaces/${workspace._id}/milestones/bulk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ milestones: templateMilestones })
      });

      if (response.ok) {
        const data = await response.json();
        onRefresh();
        toast.success(`Created ${data.data.length} milestones from template!`);
        setShowTemplateModal(false);
      } else {
        throw new Error('Failed to create milestones from template');
      }
    } catch (error) {
      console.error('Error applying template:', error);
      toast.error('Failed to apply template');
    }
  };

  const isClient = user.userType === 'client' || user.role === 'client';
  
  // Check if the current user is the freelancer of this workspace (can create milestones)
  const isWorkspaceFreelancer = workspace && user && workspace.freelancer && 
    (workspace.freelancer._id === user._id || workspace.freelancer._id === user.id);
  
  // Check if the current user is the client of this workspace (can only view/approve milestones)
  const isWorkspaceClient = workspace && user && workspace.client && 
    (workspace.client._id === user._id || workspace.client._id === user.id);
  
  console.log('User object in MilestonesTab:', user);
  console.log('Workspace object:', workspace);
  console.log('isWorkspaceFreelancer:', isWorkspaceFreelancer);
  console.log('isWorkspaceClient:', isWorkspaceClient);

  try {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Project Milestones</h3>
          {/* Only freelancers can create/choose templates for milestones */}
          {isWorkspaceFreelancer && !showCreateForm && (
            <div className="flex space-x-3">
              <button
                onClick={() => setShowTemplateModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Choose Template
              </button>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create Milestone
              </button>
            </div>
          )}
          {/* Clients can only view and approve milestones */}
          {isWorkspaceClient && (
            <div className="text-sm text-gray-600">
              Review and approve milestones created by the freelancer
            </div>
          )}
        </div>

      {/* Create Form - Only for freelancers */}
      {showCreateForm && isWorkspaceFreelancer && (
        <div className="p-4 border-b bg-gray-50">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Milestone Title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="border rounded-lg px-3 py-2"
                required
              />
              <input
                type="number"
                placeholder="Amount (₹)"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="border rounded-lg px-3 py-2"
                required
              />
            </div>
            
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 h-20"
              required
            />
            
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              className="border rounded-lg px-3 py-2"
              required
            />

            <div>
              <label className="block text-sm font-medium mb-2">Requirements</label>
              {formData.requirements.map((req, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="text"
                    value={req}
                    onChange={(e) => updateRequirement(index, e.target.value)}
                    className="flex-1 border rounded-lg px-3 py-2"
                    placeholder={`Requirement ${index + 1}`}
                  />
                  {formData.requirements.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRequirement(index)}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addRequirement}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                + Add Requirement
              </button>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create Milestone
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Milestones List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {Array.isArray(milestones) && milestones.length > 0 ? (
            milestones.map(milestone => {
              // Safely handle milestone data
              if (!milestone || !milestone._id) {
                console.warn('Invalid milestone data:', milestone);
                return null;
              }
              
              const requirements = Array.isArray(milestone.requirements) ? milestone.requirements : [];
              const attachments = Array.isArray(milestone.attachments) ? milestone.attachments : [];
              
              return (
                <div key={milestone._id} className="border rounded-lg p-4 hover:shadow-md">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{milestone.title || 'Untitled'}</h4>
                      <p className="text-gray-600">{milestone.description || 'No description'}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(milestone.status || 'pending')}`}>
                        {(milestone.status || 'pending').replace('-', ' ').toUpperCase()}
                      </span>
                      <p className="text-lg font-bold text-green-600 mt-1">
                        ₹{milestone.amount || 0}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                    <p>Due: {milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : 'No due date'}</p>
                    <p>Order: #{milestone.order || 1}</p>
                  </div>

                  {requirements.length > 0 && (
                    <div className="mb-3">
                      <p className="font-medium text-sm mb-2">Requirements:</p>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {requirements.map((req, index) => (
                          <li key={index}>
                            {typeof req === 'string' ? req : req.description || 'Requirement'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {attachments.length > 0 && (
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <span className="mr-2">📎</span>
                      {attachments.length} attachment(s)
                    </div>
                  )}

                  {/* Approval Buttons for Clients (when milestone is pending/review) */}
                  {isWorkspaceClient && (milestone.status === 'pending' || milestone.status === 'review') && (
                    <div className="mt-4 pt-3 border-t">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleApproveMilestone(milestone._id, 'approved')}
                          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center"
                        >
                          <CheckIcon className="w-5 h-5 mr-2" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleApproveMilestone(milestone._id, 'rejected')}
                          className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center"
                        >
                          <XMarkIcon className="w-5 h-5 mr-2" />
                          Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Payment Status Display */}
                  {milestone.paymentStatus === 'completed' && (
                    <div className="mt-4 pt-3 border-t">
                      <div className="flex items-center text-green-600">
                        <span className="mr-2">✅</span>
                        <span className="font-medium">Payment Completed</span>
                      </div>
                    </div>
                  )}

                  {milestone.paymentStatus === 'pending' && (
                    <div className="mt-4 pt-3 border-t">
                      <div className="flex items-center text-yellow-600">
                        <span className="mr-2">⏳</span>
                        <span className="font-medium">Payment Processing</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-500 py-8">
              No milestones created yet
            </div>
          )}
        </div>
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <MilestoneTemplateModal
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          onApplyTemplate={handleApplyTemplate}
          projectType={workspace.project?.category || 'full-stack-development'}
          budget={workspace.project?.budgetAmount || 10000}
        />
      )}
    </div>
  );
  } catch (error) {
    console.error('Error in MilestonesTab:', error);
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-red-500">
            <p>Error loading milestones</p>
            <p className="text-sm mt-2">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }
};

// Deliverables Tab Component
const DeliverablesTab = ({ deliverables, workspace, milestones, user, onRefresh }) => {
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'file',
    milestone: '',
    submissionNotes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState([]);

  const isFreelancer = user.userType === 'freelancer';

  const handleSubmitDeliverable = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append('title', formData.title);
      formDataObj.append('description', formData.description);
      formDataObj.append('type', formData.type);
      formDataObj.append('submissionNotes', formData.submissionNotes);
      
      if (formData.milestone) {
        formDataObj.append('milestone', formData.milestone);
      }

      // Add files if any
      files.forEach(file => {
        formDataObj.append('files', file);
      });

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/workspaces/${workspace._id}/deliverables`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataObj
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Deliverable submitted successfully!');
        setFormData({
          title: '',
          description: '',
          type: 'file',
          milestone: '',
          submissionNotes: ''
        });
        setFiles([]);
        setShowSubmitForm(false);
        onRefresh();
      } else {
        throw new Error(data.message || 'Failed to submit deliverable');
      }
    } catch (error) {
      console.error('Error submitting deliverable:', error);
      toast.error(error.message || 'Failed to submit deliverable');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'revision-requested': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold">Deliverables</h3>
        {isFreelancer && !showSubmitForm && (
          <button
            onClick={() => setShowSubmitForm(true)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Submit Deliverable
          </button>
        )}
      </div>

      {/* Submit Form */}
      {showSubmitForm && (
        <div className="p-4 border-b bg-gray-50">
          <form onSubmit={handleSubmitDeliverable} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Deliverable Title *"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="border rounded-lg px-3 py-2"
                required
              />
              <select
                value={formData.milestone}
                onChange={(e) => setFormData(prev => ({ ...prev, milestone: e.target.value }))}
                className="border rounded-lg px-3 py-2"
              >
                <option value="">Select Milestone (Optional)</option>
                {milestones.map(milestone => (
                  <option key={milestone._id} value={milestone._id}>
                    {milestone.title}
                  </option>
                ))}
              </select>
            </div>

            <textarea
              placeholder="Description *"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 h-20"
              required
            />

            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="border rounded-lg px-3 py-2"
            >
              <option value="file">File Upload</option>
              <option value="link">External Link</option>
              <option value="text">Text Content</option>
              <option value="design">Design</option>
              <option value="document">Document</option>
            </select>

            {/* File Upload for file type */}
            {formData.type === 'file' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Files
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {files.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">Selected files:</p>
                    <ul className="text-sm text-gray-500">
                      {files.map((file, index) => (
                        <li key={index}>• {file.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <textarea
              placeholder="Submission Notes (Optional)"
              value={formData.submissionNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, submissionNotes: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 h-16"
            />

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
              >
                {submitting ? 'Submitting...' : 'Submit Deliverable'}
              </button>
              <button
                type="button"
                onClick={() => setShowSubmitForm(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Deliverables List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {deliverables.map(deliverable => (
            <div key={deliverable._id} className="border rounded-lg p-4 hover:shadow-md">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-lg">{deliverable.title}</h4>
                  <p className="text-gray-600">{deliverable.description}</p>
                  {deliverable.milestone && (
                    <p className="text-sm text-blue-600 mt-1">
                      Milestone: {deliverable.milestone.title}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(deliverable.status)}`}>
                    {deliverable.status.replace('-', ' ').toUpperCase()}
                  </span>
                  {deliverable.rating && (
                    <div className="flex items-center mt-2">
                      <span className="text-yellow-500">★</span>
                      <span className="ml-1 text-sm">{deliverable.rating}/5</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-3">
                <p>Submitted: {new Date(deliverable.submissionDate).toLocaleDateString()}</p>
                <p>By: {deliverable.submittedBy.fullName}</p>
                {deliverable.reviewDate && (
                  <p>Reviewed: {new Date(deliverable.reviewDate).toLocaleDateString()}</p>
                )}
              </div>

              {deliverable.submissionNotes && (
                <div className="mb-3">
                  <p className="font-medium text-sm">Submission Notes:</p>
                  <p className="text-sm text-gray-600">{deliverable.submissionNotes}</p>
                </div>
              )}

              {deliverable.reviewNotes && (
                <div className="mb-3">
                  <p className="font-medium text-sm">Review Notes:</p>
                  <p className="text-sm text-gray-600">{deliverable.reviewNotes}</p>
                </div>
              )}

              {/* Content Display */}
              {deliverable.content.files.length > 0 && (
                <div className="mb-3">
                  <p className="font-medium text-sm mb-2">Files:</p>
                  <div className="space-y-1">
                    {deliverable.content.files.map((file, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <span className="mr-2">📎</span>
                        <a href={file.url} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                          {file.originalName}
                        </a>
                        <span className="ml-2 text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {deliverable.content.links.length > 0 && (
                <div className="mb-3">
                  <p className="font-medium text-sm mb-2">Links:</p>
                  <div className="space-y-1">
                    {deliverable.content.links.map((link, index) => (
                      <div key={index} className="text-sm">
                        <a href={link.url} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                          {link.title || link.url}
                        </a>
                        {link.description && (
                          <p className="text-gray-500 ml-4">{link.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {deliverable.content.textContent && (
                <div className="mb-3">
                  <p className="font-medium text-sm mb-2">Content:</p>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    {deliverable.content.textContent}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {deliverables.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No deliverables submitted yet
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedMilestone && (
        <PaymentModal
          milestone={selectedMilestone}
          workspace={workspace}
          onSuccess={handlePaymentSuccess}
          onClose={handlePaymentClose}
        />
      )}
    </div>
  );
};

// Payments Tab Component
const PaymentsTab = ({ milestones, workspace, user, onPaymentSuccess, onRefresh }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);

  const handlePayMilestone = (milestone) => {
    setSelectedMilestone(milestone);
    setShowPaymentModal(true);
  };

  const handlePaymentClose = () => {
    setShowPaymentModal(false);
    setSelectedMilestone(null);
  };

  const handlePaymentSuccess = () => {
    onRefresh(); 
    onPaymentSuccess();
    setShowPaymentModal(false);
    setSelectedMilestone(null);
  };

  // Check if milestone is due (current date >= due date)
  const isMilestoneDue = (dueDate) => {
    if (!dueDate) return false;
    const currentDate = new Date();
    const milestoneDate = new Date(dueDate);
    return currentDate >= milestoneDate;
  };

  // Filter milestones that are approved and due for payment
  const payableMilestones = milestones.filter(milestone => 
    milestone.status === 'approved' && 
    milestone.paymentStatus !== 'completed' &&
    isMilestoneDue(milestone.dueDate)
  );

  // Filter milestones that are approved but not yet due
  const upcomingPayments = milestones.filter(milestone => 
    milestone.status === 'approved' && 
    milestone.paymentStatus !== 'completed' &&
    !isMilestoneDue(milestone.dueDate)
  );

  // Filter completed payments
  const completedPayments = milestones.filter(milestone => 
    milestone.paymentStatus === 'completed'
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          
          {/* Due Payments Section */}
          {payableMilestones.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-red-600 mb-4 flex items-center">
                <CreditCardIcon className="w-5 h-5 mr-2" />
                Due for Payment ({payableMilestones.length})
              </h3>
              <div className="space-y-4">
                {payableMilestones.map(milestone => (
                  <div key={milestone._id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-lg">{milestone.title}</h4>
                        <p className="text-gray-600 text-sm mt-1">{milestone.description}</p>
                        <p className="text-red-600 text-sm mt-2">
                          <strong>Due Date:</strong> {new Date(milestone.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">₹{milestone.amount}</p>
                        <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                          PAYMENT DUE
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePayMilestone(milestone)}
                      className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center"
                    >
                      <CreditCardIcon className="w-5 h-5 mr-2" />
                      Pay Now - ₹{milestone.amount}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Payments Section */}
          {upcomingPayments.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-yellow-600 mb-4 flex items-center">
                <ClockIcon className="w-5 h-5 mr-2" />
                Upcoming Payments ({upcomingPayments.length})
              </h3>
              <div className="space-y-4">
                {upcomingPayments.map(milestone => (
                  <div key={milestone._id} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-lg">{milestone.title}</h4>
                        <p className="text-gray-600 text-sm mt-1">{milestone.description}</p>
                        <p className="text-yellow-600 text-sm mt-2">
                          <strong>Due Date:</strong> {new Date(milestone.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">₹{milestone.amount}</p>
                        <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                          UPCOMING
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Payments Section */}
          {completedPayments.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-green-600 mb-4 flex items-center">
                <CheckIcon className="w-5 h-5 mr-2" />
                Completed Payments ({completedPayments.length})
              </h3>
              <div className="space-y-4">
                {completedPayments.map(milestone => (
                  <div key={milestone._id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-lg">{milestone.title}</h4>
                        <p className="text-gray-600 text-sm mt-1">{milestone.description}</p>
                        <p className="text-green-600 text-sm mt-2">
                          <strong>Paid on:</strong> {milestone.paidDate ? new Date(milestone.paidDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">₹{milestone.amount}</p>
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          PAID
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Payments Available */}
          {payableMilestones.length === 0 && upcomingPayments.length === 0 && completedPayments.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              <CreditCardIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No Payments Required</h3>
              <p>There are no approved milestones ready for payment at this time.</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedMilestone && (
        <PaymentModal
          milestone={selectedMilestone}
          workspace={workspace}
          isOpen={showPaymentModal}
          onClose={handlePaymentClose}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default WorkspaceInterface;