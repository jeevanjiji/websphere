import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  ClockIcon,
  StarIcon,
  DocumentTextIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { Button, Card, Badge } from './ui';

const FreelancerDashboard = () => {
  const [activeTab, setActiveTab] = useState('browse');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProjects: 0
  });

  const tabs = [
    { id: 'browse', name: 'Browse Projects', icon: MagnifyingGlassIcon },
    { id: 'proposals', name: 'My Proposals', icon: DocumentTextIcon },
    { id: 'active', name: 'Active Projects', icon: BriefcaseIcon },
    { id: 'earnings', name: 'Earnings', icon: CurrencyDollarIcon },
  ];

  // Fetch projects from API
  const fetchProjects = async (page = 1, search = '', skills = '') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to view projects');
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });

      if (search.trim()) {
        params.append('search', search.trim());
      }
      if (skills.trim()) {
        params.append('skills', skills.trim());
      }

      const response = await fetch(`http://localhost:5000/api/projects/browse?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setProjects(data.projects);
        setPagination(data.pagination);
      } else {
        toast.error(data.message || 'Failed to fetch projects');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load projects when component mounts or when activeTab changes to browse
  useEffect(() => {
    if (activeTab === 'browse') {
      fetchProjects(1, searchTerm, selectedSkills);
    }
  }, [activeTab]);

  // Handle search
  const handleSearch = () => {
    fetchProjects(1, searchTerm, selectedSkills);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    fetchProjects(newPage, searchTerm, selectedSkills);
  };



  // Helper function to format project data for display
  const formatProject = (project) => {
    const timeAgo = new Date(project.createdAt).toLocaleDateString();
    const budget = project.budgetType === 'fixed'
      ? `$${project.budgetAmount} (Fixed)`
      : `$${project.budgetAmount}/hr (Hourly)`;

    return {
      ...project,
      budget,
      postedTime: timeAgo,
      client: project.client?.fullName || 'Anonymous Client'
    };
  };

  const renderBrowseProjects = () => (
    <div className="space-y-6">
      {/* Search and Filter Section */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        />
        <input
          type="text"
          placeholder="Filter by skills (e.g., React, Node.js)"
          value={selectedSkills}
          onChange={(e) => setSelectedSkills(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        />
        <button
          onClick={handleSearch}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Search
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-600">Loading projects...</p>
        </div>
      )}

      {/* Projects List */}
      {!loading && projects.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">No projects found. Try adjusting your search criteria.</p>
        </div>
      )}

      {/* Project Cards */}
      {!loading && projects.length > 0 && (
        <div>
          <div className="mb-4 text-sm text-gray-600">
            Showing {projects.length} of {pagination.totalProjects} projects
          </div>

          {projects.map((project) => {
            const formattedProject = formatProject(project);
            return (
              <Card
                key={project._id}
                variant="default"
                padding="default"
                hover={true}
                className="mb-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="heading-4">{formattedProject.title}</h3>
                  <span className="text-sm text-gray-500">{formattedProject.postedTime}</span>
                </div>

                <p className="body-regular mb-4">{formattedProject.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {formattedProject.skills.map((skill, index) => (
                    <Badge
                      key={`${skill}-${index}`}
                      variant="primary"
                      size="small"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <CurrencyDollarIcon className="h-4 w-4" />
                      {formattedProject.budget}
                    </span>
                    {formattedProject.deadline && (
                      <span className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        Due: {new Date(formattedProject.deadline).toLocaleDateString()}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <UserIcon className="h-4 w-4" />
                      {formattedProject.client}
                    </span>
                  </div>
                  <Button variant="primary" size="medium">
                    Apply Now
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && projects.length > 0 && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>

          <span className="text-sm text-gray-600">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>

          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );

  const renderMyProposals = () => (
    <Card variant="default" padding="large" className="text-center">
      <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 className="heading-4 mb-2">No proposals yet</h3>
      <p className="body-regular">Start applying to projects to see your proposals here.</p>
    </Card>
  );

  const renderActiveProjects = () => (
    <div className="text-center py-12">
      <BriefcaseIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No active projects</h3>
      <p className="text-gray-600">Your active projects will appear here once you start working.</p>
    </div>
  );

  const renderEarnings = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <CurrencyDollarIcon className="h-12 w-12 text-accent mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">$0</h3>
        <p className="text-gray-600">Total Earnings</p>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <ClockIcon className="h-12 w-12 text-accent mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">0</h3>
        <p className="text-gray-600">Hours Worked</p>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <StarIcon className="h-12 w-12 text-accent mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">0</h3>
        <p className="text-gray-600">Completed Projects</p>
      </div>
    </div>
  );


  const renderTabContent = () => {
    switch (activeTab) {
      case 'browse':
        return renderBrowseProjects();
      case 'proposals':
        return renderMyProposals();
      case 'active':
        return renderActiveProjects();
      case 'earnings':
        return renderEarnings();
      default:
        return renderBrowseProjects();
    }
  };

  return (
    <section className="py-16 bg-bg-secondary min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="heading-2 text-center mb-12">Freelancer Dashboard</h2>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center mb-8 bg-white rounded-xl p-2 shadow-card">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="hidden sm:inline">{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderTabContent()}
        </motion.div>
      </div>
    </section>
  );
};

export default FreelancerDashboard;
