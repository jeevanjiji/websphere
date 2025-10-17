// frontend/src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import UserManagement from '../components/UserManagement';
import EscrowManagement from '../components/EscrowManagement';
import { 
  UsersIcon, 
  BriefcaseIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  ChevronUpIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api.js';

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();

  useEffect(() => {
    // Wait for auth loading to complete before making redirect decisions
    if (authLoading) return;
    
    // Protect route - only authenticated admins can access
    if (!isAuthenticated || !user || user.role !== 'admin') {
      console.log('Not admin user, redirecting to login');
      navigate('/login');
      return;
    }

    fetchDashboardData();
  }, [navigate, user, isAuthenticated, authLoading]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token); // Debug log

      // Fetch dashboard stats
      console.log('Fetching dashboard stats with token:', token ? 'Token exists' : 'No token');
      const statsResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN.DASHBOARD_STATS}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Stats response status:', statsResponse.status);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('Stats data received:', statsData);
        if (statsData.success) {
          setStats(statsData.stats);
          console.log('Stats set:', statsData.stats);
        } else {
          console.error('Stats API returned success: false', statsData);
        }
      } else {
        const errorData = await statsResponse.json();
        console.error('Stats API error:', errorData);
      }

      // Fetch users
      console.log('Fetching users...');
      const usersResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN.USERS}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Users response status:', usersResponse.status);
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log('Users data received:', usersData);
        if (usersData.success) {
          setUsers(usersData.users);
          console.log('Users set:', usersData.users);
        } else {
          console.error('Users API returned success: false', usersData);
        }
      } else {
        const errorData = await usersResponse.json();
        console.error('Users API error:', errorData);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        await logout(); // Use the proper logout function from AuthContext
        toast.success('Logged out successfully');
        navigate('/login'); // Redirect to login page instead of landing page
      } catch (error) {
        console.error('Logout error:', error);
        // Fallback: still clear localStorage and redirect
        localStorage.clear();
        toast.success('Logged out successfully');
        navigate('/login');
      }
    }
  };

  // Show loading while authentication is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <ChartBarIcon className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
            </div>
            <button 
              onClick={handleLogout}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-2 rounded-lg transition-all duration-200 font-medium shadow-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200 bg-white rounded-t-lg mt-4">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Dashboard Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              👥 User Management
            </button>
            <button
              onClick={() => setActiveTab('escrow')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'escrow'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🔒 Escrow Management
            </button>
          </nav>
        </div>
      </div>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Users */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Users</p>
                    <p className="text-3xl font-bold">{stats.totalUsers || 0}</p>
                    <div className="flex items-center mt-2">
                      <ChevronUpIcon className="w-4 h-4 text-green-300" />
                      <span className="text-green-300 text-sm ml-1">+{stats.recentRegistrations || 0} this month</span>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-400 bg-opacity-30 rounded-lg">
                    <UsersIcon className="w-8 h-8" />
                  </div>
                </div>
              </div>

              {/* Revenue */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Total Revenue</p>
                    <p className="text-3xl font-bold">₹{(stats.totalRevenue || 0).toLocaleString()}</p>
                    <div className="flex items-center mt-2">
                      <ChevronUpIcon className="w-4 h-4 text-green-300" />
                      <span className="text-green-300 text-sm ml-1">{stats.paidMilestones || 0} payments</span>
                    </div>
                  </div>
                  <div className="p-3 bg-green-400 bg-opacity-30 rounded-lg">
                    <CurrencyDollarIcon className="w-8 h-8" />
                  </div>
                </div>
              </div>

              {/* Active Projects */}
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Active Projects</p>
                    <p className="text-3xl font-bold">{stats.awardedProjects || 0}</p>
                    <div className="flex items-center mt-2">
                      <ClockIcon className="w-4 h-4 text-purple-300" />
                      <span className="text-purple-300 text-sm ml-1">{stats.openProjects || 0} open</span>
                    </div>
                  </div>
                  <div className="p-3 bg-purple-400 bg-opacity-30 rounded-lg">
                    <BriefcaseIcon className="w-8 h-8" />
                  </div>
                </div>
              </div>

              {/* Platform Activity */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Active Chats</p>
                    <p className="text-3xl font-bold">{stats.activeChats || 0}</p>
                    <div className="flex items-center mt-2">
                      <ChatBubbleLeftRightIcon className="w-4 h-4 text-orange-300" />
                      <span className="text-orange-300 text-sm ml-1">{stats.totalChats || 0} total</span>
                    </div>
                  </div>
                  <div className="p-3 bg-orange-400 bg-opacity-30 rounded-lg">
                    <ChartBarIcon className="w-8 h-8" />
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* User Breakdown */}
              <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <UserGroupIcon className="w-5 h-5 mr-2 text-blue-600" />
                  User Demographics
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                      <span className="text-gray-600">Clients</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{stats.clientsCount || 0}</div>
                      <div className="text-xs text-gray-500">
                        {stats.totalUsers > 0 ? Math.round((stats.clientsCount / stats.totalUsers) * 100) : 0}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                      <span className="text-gray-600">Freelancers</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{stats.freelancersCount || 0}</div>
                      <div className="text-xs text-gray-500">
                        {stats.totalUsers > 0 ? Math.round((stats.freelancersCount / stats.totalUsers) * 100) : 0}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-gray-600">Active Users</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{stats.activeUsers || 0}</div>
                      <div className="text-xs text-gray-500">
                        {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Stats */}
              <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <BriefcaseIcon className="w-5 h-5 mr-2 text-purple-600" />
                  Project Analytics
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <EyeIcon className="w-4 h-4 text-blue-500 mr-2" />
                      <span className="text-gray-600">Open Projects</span>
                    </div>
                    <span className="font-semibold text-blue-600">{stats.openProjects || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ClockIcon className="w-4 h-4 text-yellow-500 mr-2" />
                      <span className="text-gray-600">In Progress</span>
                    </div>
                    <span className="font-semibold text-yellow-600">{stats.awardedProjects || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-gray-600">Completed</span>
                    </div>
                    <span className="font-semibold text-green-600">{stats.completedProjects || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DocumentTextIcon className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-gray-600">Total Projects</span>
                    </div>
                    <span className="font-semibold text-gray-900">{stats.totalProjects || 0}</span>
                  </div>
                </div>
              </div>

              {/* Application & Payment Stats */}
              <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <CurrencyDollarIcon className="w-5 h-5 mr-2 text-green-600" />
                  Financial Overview
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Pending Applications</span>
                    <span className="font-semibold text-orange-600">{stats.pendingApplications || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Accepted Applications</span>
                    <span className="font-semibold text-green-600">{stats.acceptedApplications || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Pending Payments</span>
                    <span className="font-semibold text-yellow-600">{stats.pendingPayments || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Completed Payments</span>
                    <span className="font-semibold text-green-600">{stats.paidMilestones || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Projects */}
              <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <BriefcaseIcon className="w-5 h-5 mr-2 text-blue-600" />
                  Recent Projects
                </h3>
                <div className="space-y-3">
                  {stats.recentProjects && stats.recentProjects.length > 0 ? (
                    stats.recentProjects.map((project, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                        <div>
                          <p className="font-medium text-gray-900 truncate">{project.title}</p>
                          <p className="text-sm text-gray-500">
                            by {project.client?.fullName || 'Unknown'} • ₹{project.budgetAmount?.toLocaleString() || 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            project.status === 'open' ? 'bg-green-100 text-green-800' :
                            project.status === 'awarded' ? 'bg-blue-100 text-blue-800' :
                            project.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {project.status}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(project.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <BriefcaseIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No recent projects</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Applications */}
              <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <DocumentTextIcon className="w-5 h-5 mr-2 text-purple-600" />
                  Recent Applications
                </h3>
                <div className="space-y-3">
                  {stats.recentApplications && stats.recentApplications.length > 0 ? (
                    stats.recentApplications.map((application, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                        <div>
                          <p className="font-medium text-gray-900">
                            {application.freelancer?.fullName || 'Unknown Freelancer'}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            Applied to: {application.project?.title || 'Unknown Project'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            application.status === 'awarded' ? 'bg-green-100 text-green-800' :
                            application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {application.status}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(application.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>No recent applications</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* All Users Table */}
            <div className="bg-white rounded-xl shadow-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <UsersIcon className="w-5 h-5 mr-2 text-blue-600" />
                  All Platform Users
                </h3>
              </div>
              <div className="p-6">
                {users.length === 0 ? (
                  <div className="text-center py-12">
                    <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No users registered yet</h3>
                    <p className="text-gray-600">Users will appear here once they register on the platform.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user._id} className="hover:bg-gray-50 transition-colors duration-200">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                    <span className="text-white font-medium text-sm">
                                      {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.role === 'admin' ? 'bg-red-100 text-red-800' :
                                user.role === 'client' ? 'bg-blue-100 text-blue-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {user.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button className="text-blue-600 hover:text-blue-900 mr-3 transition-colors duration-200">View</button>
                              <button className="text-red-600 hover:text-red-900 transition-colors duration-200">Deactivate</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && <UserManagement />}
        
        {activeTab === 'escrow' && <EscrowManagement />}
      </main>
    </div>
  );
};

export default AdminDashboard;
