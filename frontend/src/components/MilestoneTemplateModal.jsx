import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

const MilestoneTemplateModal = ({ isOpen, onClose, onApplyTemplate, projectType, budget }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customizing, setCustomizing] = useState(false);
  const [templateMilestones, setTemplateMilestones] = useState([]);

  const templates = {
    'frontend-development': {
      name: 'Website/Web App Development',
      description: 'Complete website or web application creation with user-friendly interface',
      icon: '🎨',
      estimatedDuration: '6-8 weeks'
    },
    'backend-development': {
      name: 'Server & Database Development',
      description: 'Backend system development to power your application with secure data management',
      icon: '⚙️',
      estimatedDuration: '8-10 weeks'
    },
    'full-stack-development': {
      name: 'Complete Web Application',
      description: 'Full website/application development including both user interface and server systems',
      icon: '🚀',
      estimatedDuration: '10-12 weeks'
    },
    'mobile-app-development': {
      name: 'Mobile App Development',
      description: 'Mobile application development for iOS and Android devices',
      icon: '📱',
      estimatedDuration: '8-12 weeks'
    },
    'ui-ux-design': {
      name: 'User Interface & Experience Design',
      description: 'Complete design of user-friendly and attractive interfaces',
      icon: '🎯',
      estimatedDuration: '4-6 weeks'
    },
    'data-science': {
      name: 'Data Analysis & Intelligence Project',
      description: 'Complete data analysis project to generate business insights',
      icon: '📊',
      estimatedDuration: '6-10 weeks'
    }
  };

  const fetchTemplateDetails = async (templateKey) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/milestones/templates/${templateKey}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        const projectBudget = budget && budget > 0 ? budget : 10000; // Default to 10000 if budget is missing
        const milestonesWithAmounts = data.data.milestones.map(milestone => ({
          ...milestone,
          amount: Math.round((projectBudget * milestone.percentage) / 100)
        }));
        setTemplateMilestones(milestonesWithAmounts);
        setSelectedTemplate(templateKey);
        setCustomizing(true);
      } else {
        throw new Error(data.message || 'Failed to fetch template details');
      }
    } catch (error) {
      console.error('Error fetching template details:', error);
      toast.error('Failed to load template details');
    }
  };

  const handleApplyTemplate = async () => {
    try {
      const milestonesToCreate = templateMilestones.map((milestone, index) => ({
        title: milestone.title,
        description: milestone.description,
        amount: milestone.amount,
        requirements: milestone.requirements,
        dueDate: calculateDueDate(index, templateMilestones.length),
        paymentDueDate: calculatePaymentDueDate(index, templateMilestones.length)
      }));

      await onApplyTemplate(milestonesToCreate);
      // Don't show success message here - parent component handles it
      onClose();
    } catch (error) {
      // Don't show error message here - parent component handles it
      console.error('Error in template modal:', error);
    }
  };

  const calculateDueDate = (index, totalMilestones) => {
    const weeksPerMilestone = 2; // Assuming 2 weeks per milestone on average
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + (index + 1) * weeksPerMilestone * 7);
    return startDate.toISOString().split('T')[0];
  };

  const calculatePaymentDueDate = (index, totalMilestones) => {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + (index + 1) * 2 * 7); // 2 weeks per milestone
    
    // Payment due 3 days after delivery deadline (for review and approval)
    const paymentDate = new Date(deliveryDate);
    paymentDate.setDate(paymentDate.getDate() + 3);
    
    return paymentDate.toISOString().split('T')[0];
  };

  const updateMilestoneAmount = (index, newAmount) => {
    const updated = [...templateMilestones];
    updated[index].amount = parseFloat(newAmount) || 0;
    setTemplateMilestones(updated);
  };

  const totalAmount = templateMilestones.reduce((sum, milestone) => sum + milestone.amount, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {!customizing ? (
          // Template Selection
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Choose Milestone Template</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {Object.entries(templates).map(([key, template]) => (
                <div
                  key={key}
                  onClick={() => fetchTemplateDetails(key)}
                  className="border-2 rounded-lg p-4 hover:border-blue-500 hover:shadow-lg cursor-pointer transition-all duration-200 hover:bg-blue-50"
                >
                  <div className="flex items-start">
                    <span className="text-3xl mr-4">{template.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2 text-gray-800">{template.name}</h3>
                      <p className="text-gray-600 text-sm mb-3 leading-relaxed">{template.description}</p>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>⏱️ {template.estimatedDuration}</span>
                        <span className="text-blue-600 font-medium hover:text-blue-800">Select Template →</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium mb-2 text-blue-900">💡 How Milestone Templates Work</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Clear phases:</strong> Break your project into manageable steps</li>
                <li>• <strong>Fair payments:</strong> Pay only when each milestone is completed</li>
                <li>• <strong>Time protection:</strong> Each milestone has a delivery deadline</li>
                <li>• <strong>Quality assurance:</strong> Review and approve each phase before payment</li>
              </ul>
            </div>
          </div>
        ) : (
          // Template Customization
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">Customize Template</h2>
                <p className="text-gray-600">{templates[selectedTemplate]?.name}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCustomizing(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Back
                </button>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Total Project Budget</p>
                    <p className="text-2xl font-bold text-green-600">Rs.{budget}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Allocated Amount</p>
                    <p className={`text-2xl font-bold ${totalAmount <= budget ? 'text-green-600' : 'text-red-600'}`}>
                      Rs.{totalAmount}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Remaining</p>
                    <p className={`text-lg font-semibold ${(budget - totalAmount) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      Rs.{budget - totalAmount}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {templateMilestones.map((milestone, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{milestone.title}</h4>
                      <p className="text-gray-600 text-sm">{milestone.description}</p>
                    </div>
                    <div className="ml-4">
                      <label className="block text-sm font-medium mb-1">Amount (Rs.)</label>
                      <input
                        type="number"
                        value={milestone.amount}
                        onChange={(e) => updateMilestoneAmount(index, e.target.value)}
                        className="w-24 border rounded px-2 py-1 text-sm"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm font-medium mb-2">Requirements:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {milestone.requirements.map((req, reqIndex) => (
                        <li key={reqIndex} className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-xs text-gray-500">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {milestone.percentage}% of project
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <div className="text-sm text-gray-600">
                <p>This template will create {templateMilestones.length} milestones</p>
                <p>You can further customize each milestone after creation</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setCustomizing(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Back to Templates
                </button>
                <button
                  onClick={handleApplyTemplate}
                  disabled={totalAmount > budget}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply Template
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MilestoneTemplateModal;