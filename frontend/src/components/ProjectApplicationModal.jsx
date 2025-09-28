import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { XMarkIcon, PaperClipIcon } from '@heroicons/react/24/outline';
import Button from './ui/Button';
import { toast } from 'react-hot-toast';

const ProjectApplicationModal = ({ project, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    coverLetter: '',
    proposedRate: '',
    proposedTimeline: '',
    experience: '',
    questions: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to submit application');
        return;
      }

      const response = await fetch('http://localhost:5000/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          projectId: project._id,
          ...formData,
          proposedRate: parseFloat(formData.proposedRate)
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Application submitted successfully!');
        onSuccess && onSuccess();
        onClose();
        setFormData({
          coverLetter: '',
          proposedRate: '',
          proposedTimeline: '',
          experience: '',
          questions: ''
        });
      } else {
        // Check if it's a profile completion issue
        if (data.requiresProfileCompletion) {
          toast.error(
            <div>
              <p className="font-semibold">Profile Incomplete</p>
              <p className="text-sm mt-1">{data.message}</p>
              <button 
                onClick={() => {
                  toast.dismiss();
                  // Navigate to freelancer profile setup page
                  window.location.href = '/freelancer-profile-setup';
                }}
                className="mt-2 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
              >
                Complete Profile
              </button>
            </div>,
            { duration: 8000 }
          );
        } else {
          toast.error(data.message || 'Failed to submit application');
        }
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Apply to Project</h2>
            <p className="text-gray-600 mt-1">{project?.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Cover Letter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cover Letter *
            </label>
            <textarea
              name="coverLetter"
              value={formData.coverLetter}
              onChange={handleInputChange}
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Explain why you're the perfect fit for this project..."
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.coverLetter.length}/2000 characters
            </p>
          </div>

          {/* Proposed Rate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proposed Rate (INR) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  name="proposedRate"
                  value={formData.proposedRate}
                  onChange={handleInputChange}
                  required
                  min="1"
                  step="0.01"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Project budget: Rs.{project?.budgetAmount} ({project?.budgetType})
              </p>
            </div>

            {/* Timeline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proposed Timeline *
              </label>
              <input
                type="text"
                name="proposedTimeline"
                value={formData.proposedTimeline}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 2-3 weeks"
              />
            </div>
          </div>

          {/* Experience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Relevant Experience
            </label>
            <textarea
              name="experience"
              value={formData.experience}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe your relevant experience for this project..."
            />
          </div>

          {/* Questions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Questions for the Client
            </label>
            <textarea
              name="questions"
              value={formData.questions}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Any questions or clarifications needed..."
            />
          </div>

          {/* Skills Match */}
          {project?.skills && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Required Skills</h4>
              <div className="flex flex-wrap gap-2">
                {project.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={loading || !formData.coverLetter || !formData.proposedRate || !formData.proposedTimeline}
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ProjectApplicationModal;
