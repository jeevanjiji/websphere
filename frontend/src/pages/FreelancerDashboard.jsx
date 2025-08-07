import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BriefcaseIcon,
  CurrencyDollarIcon,
  ClockIcon,
  MapPinIcon,
  StarIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import { Button, Card, Badge } from '../components/ui';

const FreelancerDashboard = () => {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('overview'); // 'overview' or 'projects'
  const navigate = useNavigate();

  // Mock project data - replace with API call
  const mockProjects = [
    {
      id: 1,
      title: "E-commerce Website Development",
      description: "Looking for a skilled developer to build a modern e-commerce platform with React and Node.js. Must have experience with payment integration and responsive design.",
      budget: "$2,500 - $5,000",
      duration: "2-3 months",
      location: "Remote",
      client: {
        name: "TechStart Inc.",
        rating: 4.8,
        reviews: 23
      },
      skills: ["React", "Node.js", "MongoDB", "Stripe"],
      postedDate: "2 days ago",
      proposals: 12
    },
    {
      id: 2,
      title: "Mobile App UI/UX Design",
      description: "Need a creative designer to design a mobile app for fitness tracking. Looking for modern, clean design with excellent user experience.",
      budget: "$1,200 - $2,000",
      duration: "3-4 weeks",
      location: "Remote",
      client: {
        name: "FitLife Solutions",
        rating: 4.9,
        reviews: 45
      },
      skills: ["Figma", "UI/UX", "Mobile Design", "Prototyping"],
      postedDate: "1 day ago",
      proposals: 8
    },
    {
      id: 3,
      title: "WordPress Website Redesign",
      description: "Existing WordPress site needs a complete redesign. Must be responsive, SEO-friendly, and load quickly. Experience with WooCommerce preferred.",
      budget: "$800 - $1,500",
      duration: "2-3 weeks",
      location: "Remote",
      client: {
        name: "Local Business Co.",
        rating: 4.6,
        reviews: 12
      },
      skills: ["WordPress", "PHP", "CSS", "WooCommerce"],
      postedDate: "3 days ago",
      proposals: 15
    },
    {
      id: 4,
      title: "Data Analysis & Visualization",
      description: "Looking for a data analyst to analyze sales data and create interactive dashboards. Python and Tableau experience required.",
      budget: "$1,500 - $3,000",
      duration: "1-2 months",
      location: "Remote",
      client: {
        name: "DataDriven Corp",
        rating: 4.7,
        reviews: 31
      },
      skills: ["Python", "Tableau", "SQL", "Data Analysis"],
      postedDate: "1 week ago",
      proposals: 6
    }
  ];

  useEffect(() => {
    // Check if user is logged in
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || userData.role !== 'freelancer') {
      navigate('/login');
      return;
    }
    
    setUser(userData);
    setProjects(mockProjects);
    setLoading(false);
  }, [navigate]);

  const ProjectCard = ({ project }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">{project.title}</h3>
        <span className="text-sm text-gray-500 whitespace-nowrap ml-4">{project.postedDate}</span>
      </div>
      
      <p className="text-gray-600 mb-4 line-clamp-3">{project.description}</p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {project.skills.map(skill => (
          <span key={skill} className="bg-accent/10 text-accent px-3 py-1 rounded-full text-sm font-medium">
            {skill}
          </span>
        ))}
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <CurrencyDollarIcon className="h-4 w-4" />
          <span>{project.budget}</span>
        </div>
        <div className="flex items-center gap-2">
          <ClockIcon className="h-4 w-4" />
          <span>{project.duration}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPinIcon className="h-4 w-4" />
          <span>{project.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <BriefcaseIcon className="h-4 w-4" />
          <span>{project.proposals} proposals</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {project.client.name.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{project.client.name}</p>
            <div className="flex items-center gap-1">
              <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600">
                {project.client.rating} ({project.client.reviews} reviews)
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors">
            <EyeIcon className="h-5 w-5" />
          </button>
          <button className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors font-medium">
            Apply
          </button>
        </div>
      </div>
    </motion.div>
  );



  if (loading) {
    return (
      <div className="min-h-screen bg-bg-secondary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-secondary">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Welcome back, {user?.fullName || 'Freelancer'}!
          </h1>
          <p className="text-xl text-white/80 mb-12">
            Find your next project and showcase your skills to clients worldwide
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveView('projects')}
              className="bg-accent hover:bg-accent/90 text-white px-8 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
              Find Projects
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white/20 hover:bg-white/30 text-white px-8 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors backdrop-blur-sm"
            >
              <DocumentTextIcon className="h-5 w-5" />
              My Proposals
            </motion.button>
          </div>
        </motion.div>

        {/* Projects Section */}
        {activeView === 'projects' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-white">Available Projects</h2>
              <span className="text-white/80">{projects.length} projects found</span>
            </div>

            <div className="grid gap-6">
              {projects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FreelancerDashboard;
