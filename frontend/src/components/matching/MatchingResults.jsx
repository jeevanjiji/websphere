// Frontend component for displaying matching results
// frontend/src/components/matching/MatchingResults.jsx
import React, { useState, useEffect } from 'react';
import { 
  UserIcon, 
  StarIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const MatchingResults = ({ projectId, onFreelancerSelect }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [filters, setFilters] = useState({
    minScore: 0.3,
    experienceLevel: 'all',
    maxRate: null
  });
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    fetchMatches();
    fetchAnalytics();
  }, [projectId, filters]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        minScore: filters.minScore,
        limit: 20
      });

      const response = await fetch(`/api/matching/freelancers/${projectId}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMatches(data.data.matches || []);
      }
    } catch (error) {
      console.error('Failed to fetch matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/matching/analytics/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getExperienceBadge = (level) => {
    const colors = {
      beginner: 'bg-blue-100 text-blue-800',
      intermediate: 'bg-purple-100 text-purple-800',
      expert: 'bg-green-100 text-green-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Finding perfect matches...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header with Analytics Toggle */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <SparklesIcon className="h-6 w-6 text-blue-600 mr-2" />
            AI-Powered Matching Results
          </h2>
          <p className="text-gray-600 mt-1">
            Found {matches.length} highly compatible freelancers using neural retrieval
          </p>
        </div>
        
        <button
          onClick={() => setShowAnalytics(!showAnalytics)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ChartBarIcon className="h-4 w-4 mr-2" />
          {showAnalytics ? 'Hide' : 'Show'} Analytics
        </button>
      </div>

      {/* Analytics Panel */}
      {showAnalytics && analytics && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Matching Analytics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {analytics.statistics.totalFreelancers}
              </div>
              <div className="text-sm text-gray-600">Total Freelancers</div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {analytics.statistics.qualifiedFreelancers}
              </div>
              <div className="text-sm text-gray-600">Qualified Matches</div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {analytics.statistics.applications}
              </div>
              <div className="text-sm text-gray-600">Applications</div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {Math.round(analytics.statistics.matchRate * 100)}%
              </div>
              <div className="text-sm text-gray-600">Match Rate</div>
            </div>
          </div>

          {/* Recommendations */}
          {analytics.recommendations.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-amber-800 mb-2">Recommendations</h4>
              <ul className="space-y-2">
                {analytics.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-amber-700 flex items-start">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 mt-2 ${
                      rec.priority === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}></span>
                    {rec.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="text-sm font-medium text-gray-700">Min Score:</label>
            <select 
              value={filters.minScore}
              onChange={(e) => setFilters({...filters, minScore: parseFloat(e.target.value)})}
              className="ml-2 border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value={0.3}>30%</option>
              <option value={0.5}>50%</option>
              <option value={0.7}>70%</option>
              <option value={0.9}>90%</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700">Experience:</label>
            <select 
              value={filters.experienceLevel}
              onChange={(e) => setFilters({...filters, experienceLevel: e.target.value})}
              className="ml-2 border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="expert">Expert</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      {matches.length === 0 ? (
        <div className="text-center py-12">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No matches found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your filters or project requirements.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((match) => (
            <FreelancerMatchCard 
              key={match.freelancer._id} 
              match={match} 
              onSelect={onFreelancerSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FreelancerMatchCard = ({ match, onSelect }) => {
  const { freelancer, scores } = match;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
         onClick={() => onSelect?.(freelancer)}>
      {/* Header with Score */}
      <div className="p-6 pb-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <img
              className="h-12 w-12 rounded-full object-cover"
              src={freelancer.profilePicture || `/api/placeholder/48/48`}
              alt={freelancer.fullName}
            />
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-gray-900">
                {freelancer.fullName}
              </h3>
              <div className="flex items-center mt-1">
                {freelancer.rating?.average > 0 && (
                  <>
                    <div className="flex items-center">
                      <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600 ml-1">
                        {freelancer.rating.average.toFixed(1)} ({freelancer.rating.count})
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            scores.total >= 0.8 ? 'bg-green-100 text-green-800' :
            scores.total >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {Math.round(scores.total * 100)}% Match
          </div>
        </div>

        {/* Bio */}
        {freelancer.bio && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {freelancer.bio}
          </p>
        )}

        {/* Skills */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {freelancer.skills.slice(0, 4).map((skill, index) => (
              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md">
                {skill}
              </span>
            ))}
            {freelancer.skills.length > 4 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                +{freelancer.skills.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Experience and Rate */}
        <div className="flex justify-between items-center mb-4">
          {freelancer.experienceLevel && (
            <span className={`px-2 py-1 text-xs rounded-md font-medium ${
              freelancer.experienceLevel === 'expert' ? 'bg-green-100 text-green-800' :
              freelancer.experienceLevel === 'intermediate' ? 'bg-purple-100 text-purple-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {freelancer.experienceLevel.charAt(0).toUpperCase() + freelancer.experienceLevel.slice(1)}
            </span>
          )}
          
          {freelancer.hourlyRate && (
            <div className="flex items-center text-sm text-gray-600">
              <CurrencyDollarIcon className="h-4 w-4 mr-1" />
              Rs.{freelancer.hourlyRate}/hr
            </div>
          )}
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="text-xs text-gray-500 mb-2">Match Breakdown</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span>Skills:</span>
            <span className="font-medium">{Math.round(scores.skill * 100)}%</span>
          </div>
          <div className="flex justify-between">
            <span>Experience:</span>
            <span className="font-medium">{Math.round(scores.experience * 100)}%</span>
          </div>
          <div className="flex justify-between">
            <span>Rate:</span>
            <span className="font-medium">{Math.round(scores.rate * 100)}%</span>
          </div>
          <div className="flex justify-between">
            <span>Portfolio:</span>
            <span className="font-medium">{Math.round(scores.portfolio * 100)}%</span>
          </div>
        </div>
        
        {match.matchReason && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-xs text-blue-600 font-medium">
              {match.matchReason}
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="px-6 py-4">
        <button 
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(freelancer);
          }}
        >
          View Profile & Invite
        </button>
      </div>
    </div>
  );
};

export default MatchingResults;