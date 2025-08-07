// frontend/src/pages/ClientDashboard.jsx (or wherever your file is)
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PostProjectForm from '../components/PostProjectForm'; // Adjust path as needed
import { Card } from './ui';

const ClientDashboard = ({ showForm, setShowForm }) => {
  const navigate = useNavigate();
  const [myProjects, setMyProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // TODO: Optionally, fetch user session info from backend to check auth
    fetchMyProjects();
  }, [navigate]);

  const fetchMyProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/projects/my', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMyProjects(data.projects || []);
      } else {
        console.error('Failed to fetch projects:', response.status);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };



  const handleProjectSuccess = (newProject) => {
    console.log('Project created successfully:', newProject);
    setShowForm(false);
    fetchMyProjects(); // Refresh the project list
    toast.success('Project posted successfully!');
  };

  return (
    <div className="min-h-screen bg-bg-secondary">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-16 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="heading-2 text-center mb-12">Client Dashboard</h2>

          {/* Welcome Section */}
          <Card variant="default" padding="default" className="mb-6">
            <h3 className="heading-4 mb-2">
              Welcome to your Client Dashboard!
            </h3>
            <p className="body-regular">
              Here you can manage your projects and track their progress. Use the "Post a Project" button above to get started.
            </p>
          </Card>

          {/* My Projects Section */}
          <Card variant="default" padding="default">
            <h3 className="heading-4 mb-4">My Projects</h3>

            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading projects...</p>
              </div>
            ) : myProjects.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h4 className="heading-4 mb-2">No projects yet</h4>
                <p className="body-regular">Get started by posting your first project!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myProjects.map(project => (
                  <div key={project._id} className="border border-gray-border rounded-lg p-4 hover:shadow-card transition-shadow">
                    <h4 className="font-semibold text-gray-dark">{project.title}</h4>
                    <p className="text-gray-medium text-sm mt-1 line-clamp-2">{project.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        project.status === 'open' ? 'bg-primary/10 text-primary' :
                        project.status === 'in_progress' ? 'bg-info/10 text-info' :
                        project.status === 'completed' ? 'bg-success/10 text-success' :
                        'bg-error/10 text-error'
                      }`}>
                        {project.status.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>

      {/* Modal for Post Project Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Post a New Project</h2>
                <button 
                  onClick={() => {
                    console.log('Close button clicked'); // Debug log
                    setShowForm(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <PostProjectForm onSuccess={handleProjectSuccess} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
