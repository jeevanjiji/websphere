import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ChatInterface from './ChatInterface';
import { toast } from 'react-hot-toast';

const WorkspaceInterface = ({ projectId, applicationId, onClose }) => {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [milestones, setMilestones] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [files, setFiles] = useState([]);

  // Fetch workspace data
  useEffect(() => {
    fetchWorkspace();
  }, [projectId, applicationId]);

  const fetchWorkspace = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // First, check if workspace exists or create it
      const response = await fetch(`http://localhost:5000/api/workspaces/project/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setWorkspace(data.data);
        
        // Fetch related data
        await Promise.all([
          fetchMilestones(data.data._id),
          fetchDeliverables(data.data._id),
          fetchFiles(data.data._id)
        ]);
      } else if (response.status === 404) {
        // Workspace not found - this shouldn't happen if application was properly accepted
        toast.error('Workspace not found. Please ensure the application was properly accepted.');
        throw new Error('Workspace not found');
      } else {
        throw new Error('Failed to fetch workspace');
      }
    } catch (error) {
      console.error('Error fetching workspace:', error);
      toast.error('Failed to load workspace');
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
        throw new Error('Failed to upload files');
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files');
    }
  };

  const createMilestone = async (milestoneData) => {
    if (!workspace) return;

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
        setMilestones(prev => [...prev, data.data]);
        toast.success('Milestone created successfully!');
        return data.data;
      } else {
        throw new Error('Failed to create milestone');
      }
    } catch (error) {
      console.error('Error creating milestone:', error);
      toast.error('Failed to create milestone');
    }
  };

  if (loading) {
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
            { id: 'chat', label: 'Chat', icon: '💬' },
            { id: 'files', label: 'Files', icon: '📁' },
            { id: 'milestones', label: 'Milestones', icon: '🎯' },
            { id: 'deliverables', label: 'Deliverables', icon: '📦' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-6 py-3 font-medium ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    amount: '',
    requirements: ['']
  });

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

  const isClient = user.userType === 'client';

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold">Project Milestones</h3>
        {isClient && !showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Milestone
          </button>
        )}
      </div>

      {/* Create Form */}
      {showCreateForm && (
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
                placeholder="Amount ($)"
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
          {milestones.map(milestone => (
            <div key={milestone._id} className="border rounded-lg p-4 hover:shadow-md">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-lg">{milestone.title}</h4>
                  <p className="text-gray-600">{milestone.description}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(milestone.status)}`}>
                    {milestone.status.replace('-', ' ').toUpperCase()}
                  </span>
                  <p className="text-lg font-bold text-green-600 mt-1">
                    ${milestone.amount}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                <p>Due: {new Date(milestone.dueDate).toLocaleDateString()}</p>
                <p>Order: #{milestone.order}</p>
              </div>

              {milestone.requirements.length > 0 && (
                <div className="mb-3">
                  <p className="font-medium text-sm mb-2">Requirements:</p>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {milestone.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {milestone.attachments.length > 0 && (
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">📎</span>
                  {milestone.attachments.length} attachment(s)
                </div>
              )}
            </div>
          ))}
        </div>

        {milestones.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No milestones created yet
          </div>
        )}
      </div>
    </div>
  );
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

  const isFreelancer = user.userType === 'freelancer';

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
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Deliverable Title"
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
              placeholder="Description"
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
            </select>

            <textarea
              placeholder="Submission Notes"
              value={formData.submissionNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, submissionNotes: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 h-16"
            />

            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Submit Deliverable
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
    </div>
  );
};

export default WorkspaceInterface;