import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  StarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  EyeIcon,
  MapPinIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { Button, Card, Badge } from './ui';

const FreelancerBrowser = () => {
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState('');
  const [minRating, setMinRating] = useState('');
  const [maxRating, setMaxRating] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [hourlyRateMin, setHourlyRateMin] = useState('');
  const [hourlyRateMax, setHourlyRateMax] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalFreelancers: 0
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch freelancers from API
  const fetchFreelancers = async (page = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to browse freelancers');
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12'
      });

      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      if (selectedSkills.trim()) {
        params.append('skills', selectedSkills.trim());
      }
      if (minRating) {
        params.append('minRating', minRating);
      }
      if (maxRating) {
        params.append('maxRating', maxRating);
      }
      if (experienceLevel) {
        params.append('experienceLevel', experienceLevel);
      }
      if (hourlyRateMin) {
        params.append('hourlyRateMin', hourlyRateMin);
      }
      if (hourlyRateMax) {
        params.append('hourlyRateMax', hourlyRateMax);
      }

      const response = await fetch(`http://localhost:5000/api/freelancers/browse?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        console.log('🎯 Freelancers fetched:', data.freelancers?.length || 0);
        setFreelancers(data.freelancers);
        setPagination(data.pagination);
      } else {
        console.error('❌ Failed to fetch freelancers:', data.message);
        toast.error(data.message || 'Failed to fetch freelancers');
      }
    } catch (error) {
      console.error('Error fetching freelancers:', error);
      toast.error('Failed to load freelancers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load freelancers when component mounts
  useEffect(() => {
    fetchFreelancers(1);
  }, []);

  // Handle search
  const handleSearch = () => {
    fetchFreelancers(1);
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedSkills('');
    setMinRating('');
    setMaxRating('');
    setExperienceLevel('');
    setHourlyRateMin('');
    setHourlyRateMax('');
    setTimeout(() => fetchFreelancers(1), 0);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    fetchFreelancers(newPage);
  };

  // Format freelancer data for display
  const formatFreelancer = (freelancer) => {
    const joinedDate = new Date(freelancer.createdAt).toLocaleDateString();
    const rating = freelancer.rating?.average || 0;
    const reviewCount = freelancer.rating?.count || 0;

    return {
      ...freelancer,
      joinedDate,
      displayRating: rating.toFixed(1),
      reviewCount,
      hourlyRateDisplay: freelancer.hourlyRate ? `$${freelancer.hourlyRate}/hr` : 'Rate not set'
    };
  };

  const FreelancerCard = ({ freelancer }) => {
    const formattedFreelancer = formatFreelancer(freelancer);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className="relative">
              {formattedFreelancer.profilePicture ? (
                <img
                  src={formattedFreelancer.profilePicture}
                  alt={formattedFreelancer.fullName}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-semibold text-lg">
                    {formattedFreelancer.fullName.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {formattedFreelancer.fullName}
              </h3>
              <div className="flex items-center gap-2 mb-2">
                {formattedFreelancer.rating?.count > 0 ? (
                  <>
                    <div className="flex items-center gap-1">
                      <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">
                        {formattedFreelancer.displayRating} ({formattedFreelancer.reviewCount} reviews)
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-sm text-gray-500">No reviews yet</span>
                )}
              </div>
              <div className="text-sm text-gray-600">
                {formattedFreelancer.experienceLevel && (
                  <Badge variant="secondary" size="small" className="mr-2">
                    {formattedFreelancer.experienceLevel}
                  </Badge>
                )}
                <span>{formattedFreelancer.completedProjects || 0} projects completed</span>
              </div>
            </div>
          </div>

          {/* Bio */}
          {formattedFreelancer.bio && (
            <p className="text-gray-700 text-sm mb-4 line-clamp-3">
              {formattedFreelancer.bio}
            </p>
          )}

          {/* Skills */}
          {formattedFreelancer.skills && formattedFreelancer.skills.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {formattedFreelancer.skills.slice(0, 6).map((skill, index) => (
                  <Badge key={index} variant="outline" size="small">
                    {skill}
                  </Badge>
                ))}
                {formattedFreelancer.skills.length > 6 && (
                  <span className="text-xs text-gray-500">
                    +{formattedFreelancer.skills.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {formattedFreelancer.hourlyRate && (
                <div className="flex items-center gap-1">
                  <CurrencyDollarIcon className="h-4 w-4" />
                  <span className="font-medium">Rs.{formattedFreelancer.hourlyRate}/hr</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                <span>Joined {formattedFreelancer.joinedDate}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="small"
                icon={<EyeIcon />}
                onClick={() => {
                  // TODO: Open freelancer profile modal
                  toast.success('Freelancer profile view coming soon!');
                }}
              >
                View Profile
              </Button>
              <Button
                variant="primary"
                size="small"
                onClick={() => {
                  // TODO: Open message/invite modal
                  toast.success('Invite freelancer feature coming soon!');
                }}
              >
                Invite
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Section */}
      <Card>
        <div className="p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search freelancers by name, skills, or bio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSearch}
                  variant="primary"
                  icon={<MagnifyingGlassIcon />}
                >
                  Search
                </Button>
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant="outline"
                  icon={<AdjustmentsHorizontalIcon />}
                >
                  Filters
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t pt-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Skills Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Skills
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., React, Node.js"
                      value={selectedSkills}
                      onChange={(e) => setSelectedSkills(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                    />
                  </div>

                  {/* Rating Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Rating
                    </label>
                    <select
                      value={minRating}
                      onChange={(e) => setMinRating(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                    >
                      <option value="">Any</option>
                      <option value="1">1+ Stars</option>
                      <option value="2">2+ Stars</option>
                      <option value="3">3+ Stars</option>
                      <option value="4">4+ Stars</option>
                      <option value="4.5">4.5+ Stars</option>
                    </select>
                  </div>

                  {/* Experience Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Experience
                    </label>
                    <select
                      value={experienceLevel}
                      onChange={(e) => setExperienceLevel(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                    >
                      <option value="">Any Level</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>

                  {/* Hourly Rate Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hourly Rate (Rs.)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={hourlyRateMin}
                        onChange={(e) => setHourlyRateMin(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={hourlyRateMax}
                        onChange={(e) => setHourlyRateMax(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <Button onClick={handleClearFilters} variant="outline" size="small">
                    Clear Filters
                  </Button>
                  <Button onClick={handleSearch} variant="primary" size="small">
                    Apply Filters
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </Card>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Available Freelancers
          </h2>
          <p className="text-gray-600">
            {loading ? 'Loading...' : `${pagination.totalFreelancers} freelancers found`}
          </p>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && freelancers.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Freelancers Found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or removing some filters.
            </p>
            <Button onClick={handleClearFilters} variant="outline">
              Clear Filters
            </Button>
          </div>
        </Card>
      )}

      {/* Freelancers Grid */}
      {!loading && freelancers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {freelancers.map((freelancer) => (
            <FreelancerCard key={freelancer._id} freelancer={freelancer} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && freelancers.length > 0 && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4">
          <Button
            variant="outline"
            disabled={!pagination.hasPrevPage}
            onClick={() => handlePageChange(pagination.currentPage - 1)}
          >
            Previous
          </Button>
          
          <span className="text-gray-600">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          
          <Button
            variant="outline"
            disabled={!pagination.hasNextPage}
            onClick={() => handlePageChange(pagination.currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default FreelancerBrowser;