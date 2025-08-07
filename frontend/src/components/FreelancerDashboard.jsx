import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserIcon,
  StarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Button, Card, Badge } from './ui';

const FreelancerDashboard = () => {
  const [activeTab, setActiveTab] = useState('browse');

  const tabs = [
    { id: 'browse', name: 'Browse Projects', icon: MagnifyingGlassIcon },
    { id: 'proposals', name: 'My Proposals', icon: DocumentTextIcon },
    { id: 'active', name: 'Active Projects', icon: BriefcaseIcon },
    { id: 'earnings', name: 'Earnings', icon: CurrencyDollarIcon },
    { id: 'profile', name: 'Profile', icon: UserIcon },
  ];

  const sampleProjects = [
    {
      id: 1,
      title: "React Developer for E-commerce Platform",
      description: "Looking for an experienced React developer to build a modern e-commerce platform with payment integration.",
      budget: "$2,000 - $5,000",
      timeline: "2-3 months",
      skills: ["React", "Node.js", "MongoDB"],
      client: "TechCorp Inc.",
      postedTime: "2 hours ago"
    },
    {
      id: 2,
      title: "UI/UX Design for Mobile App",
      description: "Need a creative designer to design user interface for a fitness tracking mobile application.",
      budget: "$1,000 - $2,500",
      timeline: "1 month",
      skills: ["Figma", "Adobe XD", "Mobile Design"],
      client: "FitLife Solutions",
      postedTime: "5 hours ago"
    },
    {
      id: 3,
      title: "Python Data Analysis Project",
      description: "Analyze customer data and create insights dashboard using Python and visualization libraries.",
      budget: "$800 - $1,500",
      timeline: "2-4 weeks",
      skills: ["Python", "Pandas", "Matplotlib"],
      client: "DataDriven Analytics",
      postedTime: "1 day ago"
    }
  ];

  const renderBrowseProjects = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search projects..."
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        />
        <select className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">
          <option>All Categories</option>
          <option>Web Development</option>
          <option>Mobile Apps</option>
          <option>Design</option>
          <option>Data Science</option>
        </select>
      </div>

      {sampleProjects.map((project) => (
        <Card
          key={project.id}
          variant="default"
          padding="default"
          hover={true}
          className="mb-6"
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="heading-4">{project.title}</h3>
            <span className="text-sm text-gray-500">{project.postedTime}</span>
          </div>

          <p className="body-regular mb-4">{project.description}</p>

          <div className="flex flex-wrap gap-2 mb-4">
            {project.skills.map((skill) => (
              <Badge
                key={skill}
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
                {project.budget}
              </span>
              <span className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                {project.timeline}
              </span>
              <span className="flex items-center gap-1">
                <UserIcon className="h-4 w-4" />
                {project.client}
              </span>
            </div>
            <Button variant="primary" size="medium">
              Apply Now
            </Button>
          </div>
        </Card>
      ))}
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

  const renderProfile = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-6">Freelancer Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
            <input
              type="text"
              value={user?.profile?.firstName || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            <input
              type="text"
              value={user?.profile?.lastName || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input
              type="text"
              value={user?.username || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent"
              readOnly
            />
          </div>
        </div>
        <div className="mt-6">
          <button className="bg-accent text-white px-6 py-2 rounded-lg hover:bg-accent/90 transition-colors">
            Edit Profile
          </button>
        </div>
      </div>
    );
  };

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
      case 'profile':
        return renderProfile();
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
