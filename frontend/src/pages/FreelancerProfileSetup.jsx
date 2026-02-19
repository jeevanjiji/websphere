import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UserCircleIcon,
  SparklesIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  BriefcaseIcon,
  PhotoIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import Swal from 'sweetalert2';
import { Button, Badge } from '../components/ui';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api.js';


const FreelancerProfileSetup = () => {
  // Tab management
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Profile data state
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    location: '',
    bio: '',
    skills: [],
    profilePicture: null
  });

  // Settings state (temporarily disabled)
  // const [settings, setSettings] = useState({...});

  // Project history state
  const [projectHistory, setProjectHistory] = useState([]);

  // Load user data on component mount
  useEffect(() => {
    // Check if user is logged in first
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, redirecting to login');
      navigate('/login');
      return;
    }

    // Load data
    loadUserData();
    loadProjectHistory();
  }, [navigate]);

  const loadUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, redirecting to login');
        navigate('/login');
        return;
      }

      console.log('Loading user data with token:', token.substring(0, 20) + '...');
      console.log('Token length:', token.length);
      console.log('Making request to:', `${API_BASE_URL}${API_ENDPOINTS.PROFILE.BASE}`);

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PROFILE.BASE}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Profile API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Profile data received:', data);

        // Handle both old and new API response formats
        const user = data.user || data;
        setProfileData(prev => ({
          ...prev,
          fullName: user.fullName || '',
          email: user.email || '',
          phoneNumber: user.phoneNumber || '',
          location: user.location || '',
          bio: user.bio || '',
          skills: user.skills || [],
          profilePicture: user.profilePicture || null
        }));
      } else {
        console.error('Profile API error:', response.status);

        // Try to get error details
        let errorData;
        try {
          errorData = await response.json();
          console.error('Error details:', errorData);
        } catch (e) {
          console.error('Could not parse error response');
        }

        if (response.status === 401 || response.status === 403) {
          console.log('Authentication failed, redirecting to login');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        } else {
          // Fallback: try to load basic user data from localStorage
          const userData = localStorage.getItem('user');
          if (userData) {
            const user = JSON.parse(userData);
            setProfileData(prev => ({
              ...prev,
              fullName: user.fullName || '',
              email: user.email || '',
              bio: user.bio || '',
              skills: user.skills || []
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // Fallback: try to load basic user data from localStorage
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          setProfileData(prev => ({
            ...prev,
            fullName: user.fullName || '',
            email: user.email || '',
            bio: user.bio || '',
            skills: user.skills || []
          }));
        } catch (parseError) {
          console.error('Error parsing user data from localStorage:', parseError);
        }
      }
    }
  };

  const loadProjectHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found for project history');
        return;
      }

      console.log('Loading project history...');
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PROJECTS.MY}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Projects API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Project history received:', data);
        setProjectHistory(data.projects || []);
      } else {
        const errorData = await response.json();
        console.error('Projects API error:', response.status, errorData);
        // Set empty array as fallback
        setProjectHistory([]);
      }
    } catch (error) {
      console.error('Error loading project history:', error);
      // Set empty array as fallback
      setProjectHistory([]);
    }
  };

  const handleBackClick = useCallback(() => {
    navigate('/freelancer');
  }, [navigate]);

  // Tab definitions
  const tabs = [
    { id: 'profile', name: 'Profile Info', icon: UserCircleIcon },
    { id: 'picture', name: 'Profile Picture', icon: PhotoIcon },
    { id: 'projects', name: 'Project History', icon: BriefcaseIcon }
    // Temporarily disabled until API endpoints are fully working
    // { id: 'account', name: 'Account Settings', icon: CogIcon },
    // { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    // { id: 'notifications', name: 'Notifications', icon: BellIcon },
  ];

  // Update profile information
  const updateProfile = async (data) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Updating profile with data:', data);
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PROFILE.BASIC_INFO}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      console.log('Profile update response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Profile update successful:', result);
        setProfileData(prev => ({ ...prev, ...data }));

        Swal.fire({
          icon: 'success',
          title: 'Profile Updated!',
          text: 'Your profile information has been updated successfully.',
          confirmButtonColor: '#1DBF73'
        });
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Profile update failed:', response.status, errorData);
        throw new Error(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'Failed to update profile. Please try again.',
        confirmButtonColor: '#667eea'
      });
    } finally {
      setLoading(false);
    }
  };

  // Update bio and auto-tag skills
  const updateBio = async (bio) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.FREELANCER_AUTO_TAG}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ bio })
      });

      const data = await response.json();

      if (data.success) {
        setProfileData(prev => ({
          ...prev,
          bio: bio,
          skills: data.skills || []
        }));

        Swal.fire({
          icon: 'success',
          title: 'Bio Updated!',
          text: 'Your bio has been saved and skills have been auto-tagged.',
          confirmButtonColor: '#1DBF73'
        });
      } else {
        throw new Error(data.message || 'Failed to update bio');
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error.message || 'Failed to update bio. Please try again.',
        confirmButtonColor: '#667eea'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-secondary p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-xl mb-6">
          <div className="relative p-6">
            {/* Back Button */}
            <button
              onClick={handleBackClick}
              className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              Back to Dashboard
            </button>

            {/* Header Content */}
            <div className="text-center pt-8">
              <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                <UserCircleIcon className="h-8 w-8 text-primary" />
              </div>
              <h1 className="heading-1 mb-2">Profile Management</h1>
              <p className="body-regular text-gray-600">
                Manage your profile, settings, and view your project history
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-t border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-xl p-6"
        >
          {activeTab === 'profile' && <ProfileInfoTab profileData={profileData} setProfileData={setProfileData} updateProfile={updateProfile} updateBio={updateBio} loading={loading} />}
          {activeTab === 'picture' && <ProfilePictureTab profileData={profileData} setProfileData={setProfileData} loading={loading} setLoading={setLoading} />}
          {activeTab === 'projects' && <ProjectHistoryTab projectHistory={projectHistory} />}
        </motion.div>
      </div>
    </div>
  );
};

// Profile Info Tab Component
const ProfileInfoTab = ({ profileData, setProfileData, updateProfile, updateBio, loading }) => {
  const [formData, setFormData] = useState({
    fullName: profileData.fullName || '',
    phoneNumber: profileData.phoneNumber || '',
    location: profileData.location || '',
    bio: profileData.bio || ''
  });

  const [skills, setSkills] = useState(profileData.skills || []);

  useEffect(() => {
    setFormData({
      fullName: profileData.fullName || '',
      phoneNumber: profileData.phoneNumber || '',
      location: profileData.location || '',
      bio: profileData.bio || ''
    });
    setSkills(profileData.skills || []);
  }, [profileData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBasicInfoSubmit = async (e) => {
    e.preventDefault();
    await updateProfile({
      fullName: formData.fullName,
      phoneNumber: formData.phoneNumber,
      location: formData.location
    });
  };

  const handleBioSubmit = async (e) => {
    e.preventDefault();
    await updateBio(formData.bio);
  };

  const removeSkill = (skillToRemove) => {
    setSkills(prev => prev.filter(skill => skill !== skillToRemove));
    setProfileData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <UserCircleIcon className="h-5 w-5" />
          Basic Information
        </h3>

        <form onSubmit={handleBasicInfoSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <PhoneIcon className="h-4 w-4 inline mr-1" />
                Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="+1 (555) 123-4567"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="City, State/Country"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading}
          >
            Update Basic Info
          </Button>
        </form>
      </div>

      <div className="border-t pt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <SparklesIcon className="h-5 w-5" />
          Bio & Skills
        </h3>

        <form onSubmit={handleBioSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Professional Bio (minimum 50 characters)
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="Describe your experience, skills, and what you offer as a freelancer..."
              required
              minLength={20}
            />
            <div className="mt-1 text-right">
              <span className={`text-xs ${formData.bio.length >= 50 ? 'text-green-600' : 'text-gray-500'}`}>
                {formData.bio.length}/50 characters
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
                💡 Update your bio and resubmit to refresh skills automatically
              </p>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading || formData.bio.length < 50}
          >
            Update Bio & Extract Skills
          </Button>
        </form>
      </div>
    </div>
  );
};

// Profile Picture Tab Component
const ProfilePictureTab = ({ profileData, setProfileData, loading, setLoading }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(profileData.profilePicture || null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please log in to upload a profile picture');
      }

      console.log('Uploading profile picture:', {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type
      });

      const formData = new FormData();
      formData.append('profilePicture', selectedFile);

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PROFILE.PICTURE}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      console.log('Upload response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Upload successful:', data);
        setProfileData(prev => ({ ...prev, profilePicture: data.profilePicture }));
        setPreviewUrl(data.profilePicture);
        setSelectedFile(null);

        Swal.fire({
          icon: 'success',
          title: 'Profile Picture Updated!',
          text: 'Your profile picture has been updated successfully.',
          confirmButtonColor: '#1DBF73'
        });
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Upload failed:', response.status, errorData);
        throw new Error(errorData.message || 'Failed to upload profile picture');
      }
    } catch (error) {
      console.error('Profile picture upload error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: error.message || 'Failed to upload profile picture. Please try again.',
        confirmButtonColor: '#667eea'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <PhotoIcon className="h-5 w-5" />
          Profile Picture
        </h3>

        <div className="flex flex-col items-center space-y-6">
          {/* Current/Preview Image */}
          <div className="relative">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-200">
                <UserCircleIcon className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>

          {/* File Input */}
          <div className="w-full max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose Profile Picture
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
            <p className="text-xs text-gray-500 mt-1">
              Recommended: Square image, at least 400x400px, max 5MB
            </p>
          </div>

          {/* Upload Button */}
          {selectedFile && (
            <Button
              onClick={handleUpload}
              variant="primary"
              loading={loading}
              disabled={loading}
            >
              Upload Profile Picture
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// Account Settings Tab Component (temporarily disabled)
// const AccountSettingsTab = ({ profileData, setProfileData, loading, setLoading }) => { ... };

// Security Tab Component (temporarily disabled)
// const SecurityTab = ({ loading, setLoading }) => { ... };

// Notifications Tab Component (temporarily disabled)
// const NotificationsTab = ({ settings, setSettings, loading, setLoading }) => { ... };

// Project History Tab Component
const ProjectHistoryTab = ({ projectHistory }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'open': 'bg-green-100 text-green-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BriefcaseIcon className="h-5 w-5" />
          Project History
        </h3>

        {projectHistory.length === 0 ? (
          <div className="text-center py-12">
            <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No projects yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start applying to projects to build your history.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {projectHistory.map((project) => (
              <div key={project._id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      {project.title}
                    </h4>
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {project.description}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span>Posted: {formatDate(project.createdAt)}</span>
                      {project.deadline && (
                        <span>Deadline: {formatDate(project.deadline)}</span>
                      )}
                      <span className="font-medium text-primary">
                        Rs.{project.budgetAmount} ({project.budgetType})
                      </span>
                    </div>

                    {project.skills && project.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {project.skills.slice(0, 5).map((skill, index) => (
                          <Badge key={index} variant="secondary" size="small">
                            {skill}
                          </Badge>
                        ))}
                        {project.skills.length > 5 && (
                          <span className="text-xs text-gray-500">
                            +{project.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="ml-4 flex flex-col items-end gap-2">
                    {getStatusBadge(project.status)}
                    {project.proposals && (
                      <span className="text-xs text-gray-500">
                        {project.proposals.length} proposal{project.proposals.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FreelancerProfileSetup;
