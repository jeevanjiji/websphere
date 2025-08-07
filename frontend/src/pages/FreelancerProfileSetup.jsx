import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
// import { motion } from 'framer-motion';
import { UserCircleIcon, SparklesIcon, CheckCircleIcon, XMarkIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';
import { Button, Badge } from '../components/ui';

const FreelancerProfileSetup = () => {
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const navigate = useNavigate();

  // Memoized computed values to prevent re-renders
  const bioLength = useMemo(() => bio.length, [bio.length]);
  const isValidBio = useMemo(() => bioLength >= 20, [bioLength]);
  const characterCountClass = useMemo(() =>
    `text-xs ${isValidBio ? 'text-green-600' : 'text-gray-500'}`,
    [isValidBio]
  );

  const handleBioChange = useCallback((e) => {
    setBio(e.target.value);
  }, []);

  const removeSkill = useCallback((skillToRemove) => {
    setSkills(prev => prev.filter(skill => skill !== skillToRemove));
  }, []);

  const handleBackClick = useCallback(() => {
    navigate('/freelancer');
  }, [navigate]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create FormData for the bio submission
      const formData = new FormData();
      formData.append('bio', bio);

      const response = await fetch('http://localhost:5000/api/auth/freelancer/auto-tag-bio', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setSkills(data.skills || []);
        setProfileComplete(data.profileComplete || false);

        Swal.fire({
          icon: 'success',
          title: 'Profile Updated!',
          text: 'Your bio has been saved and skills have been auto-tagged.',
          confirmButtonColor: '#1DBF73'
        }).then(() => {
          // Always redirect to dashboard after successful profile update
          navigate('/freelancer');
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: data.message || 'Failed to update profile. Please try again.',
          confirmButtonColor: '#667eea'
        });
      }
    } catch (err) {
      console.error('Profile update error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Network Error',
        text: 'Unable to connect to server. Please check your connection and try again.',
        confirmButtonColor: '#667eea'
      });
    } finally {
      setLoading(false);
    }
  }, [bio, navigate]);

  return (
    <div className="min-h-screen bg-bg-secondary flex items-center justify-center p-4">
      <div className="relative max-w-2xl w-full">
        <div className="bg-white rounded-xl shadow-xl p-8">
        {/* Back Button */}
        <button
          onClick={handleBackClick}
          className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="text-center mb-8 mt-12">
          <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <UserCircleIcon className="h-8 w-8 text-primary" />
          </div>
          <h2 className="heading-2 mb-2">Complete Your Profile</h2>
          <p className="body-regular">Tell us about yourself and let our system extract your skills</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <SparklesIcon className="h-4 w-4" />
              Bio (minimum 20 characters)
            </label>
            <textarea
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-gray-900 placeholder-gray-400"
              rows={6}
              value={bio}
              onChange={handleBioChange}
              required
              minLength={20}
              placeholder="Describe your experience, skills, and what you offer as a freelancer. For example: 'I am a full-stack developer with 5 years of experience in React, Node.js, and MongoDB...'"
            />
            <div className="mt-1 text-right">
              <span className={characterCountClass}>
                {bioLength}/20 characters
              </span>
            </div>
          </div>

          {skills.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                Auto-tagged Skills
              </label>
              <div className="flex flex-wrap gap-2">
                {skills.map(skill => (
                  <Badge
                    key={skill}
                    variant="primary"
                    size="medium"
                    removable={true}
                    onRemove={() => removeSkill(skill)}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 Edit your bio and resubmit to update skills automatically, or click × to remove unwanted skills
              </p>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="large"
            fullWidth
            loading={loading}
            disabled={loading || !isValidBio}
          >
            {loading ? 'Saving Profile...' : 'Save Profile & Continue'}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-gray-500 text-sm">
            🚀 Once saved, you'll be redirected to your dashboard
          </p>
        </div>
        </div>
      </div>
    </div>
  );
};

export default FreelancerProfileSetup;
