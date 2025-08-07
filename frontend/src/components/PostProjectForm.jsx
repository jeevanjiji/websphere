import React, { useState } from 'react';
import toast from 'react-hot-toast';

const PostProjectForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skills: '',
    budgetType: 'fixed',
    budgetAmount: '',
    deadline: ''
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in title and description');
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();

      // Add form fields
      Object.keys(formData).forEach(key => {
        if (key === 'skills') {
          // Convert comma-separated skills to array
          const skillsArray = formData[key].split(',').map(s => s.trim()).filter(s => s);
          formDataToSend.append('skills', JSON.stringify(skillsArray));
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Add files
      files.forEach(file => {
        formDataToSend.append('attachments', file);
      });

      const response = await fetch('http://localhost:5000/api/projects', {
        method: 'POST',
        credentials: 'include',
        body: formDataToSend
      });

      const data = await response.json();

      if (data.success) {
        onSuccess(data.project);
        // Reset form
        setFormData({
          title: '',
          description: '',
          skills: '',
          budgetType: 'fixed',
          budgetAmount: '',
          deadline: ''
        });
        setFiles([]);
      } else {
        toast.error(data.message || 'Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Project Title *
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          required
          maxLength={120}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter project title"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Project Description *
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          required
          rows={6}
          maxLength={5000}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Describe your project requirements in detail"
        />
      </div>

      {/* Skills */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Required Skills
        </label>
        <input
          type="text"
          name="skills"
          value={formData.skills}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="React, Node.js, MongoDB (comma-separated)"
        />
      </div>

      {/* Budget */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Budget Type
          </label>
          <select
            name="budgetType"
            value={formData.budgetType}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="fixed">Fixed Price</option>
            <option value="hourly">Hourly Rate</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount (Rs.)
          </label>
          <input
            type="number"
            name="budgetAmount"
            value={formData.budgetAmount}
            onChange={handleInputChange}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
        </div>
      </div>

      {/* Deadline */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Project Deadline
        </label>
        <input
          type="date"
          name="deadline"
          value={formData.deadline}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Attachments (Optional)
        </label>
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
        />
        <p className="text-xs text-gray-500 mt-1">Max 5 files. Supported: PDF, DOC, images</p>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
        >
          {loading ? 'Creating...' : 'Post Project'}
        </button>
      </div>
    </form>
  );
};

export default PostProjectForm;
