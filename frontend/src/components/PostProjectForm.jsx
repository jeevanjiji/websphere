import React, { useState } from 'react';
import toast from 'react-hot-toast';


const PostProjectForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    skills: '',
    budgetType: 'fixed',
    budgetAmount: '',
    deadline: ''
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Preset categories with associated images
  const projectCategories = [
    {
      id: 'ui-ux-design',
      name: 'UI/UX Design',
      description: 'User interface and user experience design',
      image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=200&fit=crop&crop=center',
      skills: ['Figma', 'Adobe XD', 'Sketch', 'Prototyping', 'Mobile Design', 'Web Design']
    },
    {
      id: 'frontend-development',
      name: 'Frontend Development',
      description: 'Client-side web development',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop&crop=center',
      skills: ['React', 'Vue.js', 'Angular', 'JavaScript', 'HTML', 'CSS', 'TypeScript']
    },
    {
      id: 'backend-development',
      name: 'Backend Development',
      description: 'Server-side development and APIs',
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=200&fit=crop&crop=center',
      skills: ['Node.js', 'Python', 'Java', 'PHP', 'MongoDB', 'PostgreSQL', 'REST API']
    },
    {
      id: 'mobile-app-development',
      name: 'Mobile App Development',
      description: 'iOS and Android app development',
      image: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=400&h=200&fit=crop&crop=center',
      skills: ['React Native', 'Flutter', 'Swift', 'Kotlin', 'iOS', 'Android']
    },
    {
      id: 'full-stack-development',
      name: 'Full Stack Development',
      description: 'End-to-end web application development',
      image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=200&fit=crop&crop=center',
      skills: ['React', 'Node.js', 'MongoDB', 'Express', 'Full Stack', 'MERN', 'MEAN']
    },
    {
      id: 'data-science',
      name: 'Data Science & Analytics',
      description: 'Data analysis, machine learning, and visualization',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop&crop=center',
      skills: ['Python', 'R', 'Machine Learning', 'Data Analysis', 'Pandas', 'Tableau']
    },
    {
      id: 'digital-marketing',
      name: 'Digital Marketing',
      description: 'SEO, social media, and online marketing',
      image: 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=400&h=200&fit=crop&crop=center',
      skills: ['SEO', 'Google Ads', 'Social Media', 'Content Marketing', 'Analytics']
    },
    {
      id: 'graphic-design',
      name: 'Graphic Design',
      description: 'Visual design and branding',
      image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=200&fit=crop&crop=center',
      skills: ['Photoshop', 'Illustrator', 'InDesign', 'Branding', 'Logo Design']
    },
    {
      id: 'content-writing',
      name: 'Content Writing',
      description: 'Articles, blogs, and copywriting',
      image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=200&fit=crop&crop=center',
      skills: ['Content Writing', 'Copywriting', 'Blog Writing', 'SEO Writing', 'Technical Writing']
    },
    {
      id: 'other',
      name: 'Other Services',
      description: 'Custom projects and specialized services',
      image: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=400&h=200&fit=crop&crop=center',
      skills: ['Custom Solutions', 'Consulting', 'Project Management', 'Other']
    }
  ];

  // Get selected category details
  const selectedCategory = projectCategories.find(cat => cat.id === formData.category);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Auto-populate skills when category is selected
    if (name === 'category') {
      const category = projectCategories.find(cat => cat.id === value);
      if (category) {
        setFormData(prev => ({
          ...prev,
          skills: category.skills.join(', ')
        }));
      }
    }
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in title and description');
      return;
    }

    if (!formData.category) {
      toast.error('Please select a project category');
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();

      // Add form fields
      Object.keys(formData).forEach(key => {
        if (key === 'skills') {
          // Convert comma-separated skills to array
          const skillsArray = formData[key].split(',').map(s => s.trim()).filter(s => s);
          formDataToSend.append('skills', JSON.stringify(skillsArray));
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Add category image from preset
      if (selectedCategory) {
        formDataToSend.append('image', selectedCategory.image);
        formDataToSend.append('categoryName', selectedCategory.name);
      }

      // Add files
      files.forEach(file => {
        formDataToSend.append('attachments', file);
      });

      // Get the JWT token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to post a project');
        return;
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      const data = await response.json();

      if (data.success) {
        onSuccess(data.project);
        // Reset form
        setFormData({
          title: '',
          description: '',
          category: '',
          skills: '',
          budgetType: 'fixed',
          budgetAmount: '',
          deadline: ''
        });
        setFiles([]);
      } else {
        toast.error(data.message || 'Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Project Title *
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          required
          maxLength={120}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter project title"
        />
      </div>

      {/* Category Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Project Category *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectCategories.map((category) => (
            <div
              key={category.id}
              onClick={() => handleInputChange({ target: { name: 'category', value: category.id } })}
              className={`cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-md ${
                formData.category === category.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="relative mb-3 h-24 w-full overflow-hidden rounded-md bg-gray-100">
                <img
                  src={category.image}
                  alt={category.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <h3 className="font-medium text-gray-900">{category.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{category.description}</p>
              {formData.category === category.id && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Selected
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
        {selectedCategory && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Suggested skills:</strong> {selectedCategory.skills.join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Project Description *
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          required
          rows={6}
          maxLength={5000}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Describe your project requirements in detail"
        />
      </div>

      {/* Skills */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Required Skills
        </label>
        <input
          type="text"
          name="skills"
          value={formData.skills}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="React, Node.js, MongoDB (comma-separated)"
        />
      </div>

      {/* Budget */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Budget Type
          </label>
          <select
            name="budgetType"
            value={formData.budgetType}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="fixed">Fixed Price</option>
            <option value="hourly">Hourly Rate</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount (Rs.)
          </label>
          <input
            type="number"
            name="budgetAmount"
            value={formData.budgetAmount}
            onChange={handleInputChange}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
        </div>
      </div>

      {/* Deadline */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Project Deadline
        </label>
        <input
          type="date"
          name="deadline"
          value={formData.deadline}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Attachments (Optional)
        </label>
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
        />
        <p className="text-xs text-gray-500 mt-1">Max 5 files. Supported: PDF, DOC, images</p>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
        >
          {loading ? 'Creating...' : 'Post Project'}
        </button>
      </div>
    </form>
  );
};

export default PostProjectForm;
