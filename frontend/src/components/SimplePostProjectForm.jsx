import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  XMarkIcon,
  CloudArrowUpIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const SimplePostProjectForm = ({ onSuccess, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    budgetType: 'fixed',
    budgetAmount: '',
    deadline: ''
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Simplified categories - only the essentials
  const projectCategories = [
    {
      id: 'website',
      name: 'Website Development',
      description: 'Create or improve a website',
      icon: '🌐'
    },
    {
      id: 'mobile-app',
      name: 'Mobile App',
      description: 'Build an app for phones/tablets',
      icon: '📱'
    },
    {
      id: 'design',
      name: 'Design Work',
      description: 'Logos, graphics, UI design',
      icon: '🎨'
    },
    {
      id: 'writing',
      name: 'Content Writing',
      description: 'Articles, blogs, copywriting',
      icon: '✍️'
    },
    {
      id: 'marketing',
      name: 'Marketing & SEO',
      description: 'Promote your business online',
      icon: '📈'
    },
    {
      id: 'other',
      name: 'Other Services',
      description: 'Something else you need help with',
      icon: '🔧'
    }
  ];

  const budgetRanges = [
    { value: '500-2000', label: 'Rs.500 - Rs.2,000 (Small project)' },
    { value: '2000-10000', label: 'Rs.2,000 - Rs.10,000 (Medium project)' },
    { value: '10000-50000', label: 'Rs.10,000 - Rs.50,000 (Large project)' },
    { value: '50000+', label: 'Rs.50,000+ (Enterprise project)' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length + files.length > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const projectFormData = new FormData();
      
      // Set budget amount based on range selection
      let budgetAmount = formData.budgetAmount;
      if (formData.budgetAmount.includes('-')) {
        const [min, max] = formData.budgetAmount.split('-');
        budgetAmount = min; // Use minimum as the budget amount
      } else if (formData.budgetAmount.includes('+')) {
        budgetAmount = formData.budgetAmount.replace('+', ''); // Remove + sign
      }

      projectFormData.append('title', formData.title);
      projectFormData.append('description', formData.description);
      projectFormData.append('category', formData.category);
      projectFormData.append('budgetType', formData.budgetType);
      projectFormData.append('budgetAmount', budgetAmount);
      projectFormData.append('deadline', formData.deadline);
      projectFormData.append('skills', ''); // Empty skills for simplified form

      // Add files
      files.forEach(file => {
        projectFormData.append('files', file);
      });

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: projectFormData
      });

      if (response.ok) {
        const newProject = await response.json();
        toast.success('🎉 Project posted successfully! Freelancers can now apply.');
        if (onSuccess) {
          onSuccess(newProject);
        }
        if (onClose) {
          onClose();
        }
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to post project');
      }
    } catch (error) {
      console.error('Error posting project:', error);
      toast.error(error.message || 'Failed to post project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Post a New Project</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Project Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What do you need help with? *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Build a website for my restaurant"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What type of project is this? *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {projectCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: category.id }))}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    formData.category === category.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-2">{category.icon}</div>
                  <h3 className="font-medium text-gray-900 text-sm">{category.name}</h3>
                  <p className="text-xs text-gray-600 mt-1">{category.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe your project in detail *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              placeholder="Explain what you want to achieve, any specific requirements, and what success looks like..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Tip: Be specific about what you want. The more details you provide, the better proposals you'll receive.
            </p>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What's your budget range? *
            </label>
            <div className="space-y-2">
              {budgetRanges.map((range) => (
                <button
                  key={range.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, budgetAmount: range.value }))}
                  className={`w-full p-3 border-2 rounded-lg text-left transition-all ${
                    formData.budgetAmount === range.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CurrencyDollarIcon className="h-5 w-5 inline mr-2 text-gray-600" />
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              When do you need this completed?
            </label>
            <input
              type="date"
              name="deadline"
              value={formData.deadline}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Upload any relevant files (optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <label className="cursor-pointer">
                <span className="text-blue-600 hover:text-blue-700">Click to upload files</span>
                <span className="text-gray-600"> or drag and drop</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-500 mt-2">
                PDF, DOC, images up to 10MB each. Max 5 files.
              </p>
            </div>

            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Posting...' : 'Post Project'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default SimplePostProjectForm;
