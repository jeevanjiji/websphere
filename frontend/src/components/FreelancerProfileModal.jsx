import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  StarIcon,
  UserIcon,
  BriefcaseIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  CalendarIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';
import { Card, Badge, Button } from './ui';

const FreelancerProfileModal = ({ freelancer, isOpen, onClose, onHireFreelancer }) => {
  if (!freelancer) return null;

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <Card className="bg-white">
              {/* Header */}
              <div className="relative p-6 bg-gradient-to-r from-primary to-primary-dark text-white rounded-t-lg">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>

                {/* Profile Header */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg flex-shrink-0">
                    <img
                      src={freelancer.image || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face'}
                      alt={freelancer.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h2 className="heading-3 mb-1">{freelancer.title}</h2>
                    <div className="flex items-center gap-2 mb-2">
                      <StarIcon className="w-5 h-5 text-yellow-300 fill-current" />
                      <span className="text-white text-opacity-90">{freelancer.client}</span>
                    </div>
                    <div className="flex items-center gap-1 text-white text-opacity-80">
                      <CheckBadgeIcon className="w-4 h-4" />
                      <span className="text-sm">Verified Freelancer</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <BriefcaseIcon className="w-6 h-6 text-primary mx-auto mb-1" />
                    <div className="text-lg font-bold text-gray-dark">{freelancer.timeline}</div>
                    <div className="text-xs text-gray-medium">Experience</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <CurrencyDollarIcon className="w-6 h-6 text-green-600 mx-auto mb-1" />
                    <div className="text-lg font-bold text-gray-dark">{freelancer.budget}</div>
                    <div className="text-xs text-gray-medium">Hourly Rate</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <StarIcon className="w-6 h-6 text-yellow-500 mx-auto mb-1 fill-current" />
                    <div className="text-lg font-bold text-gray-dark">
                      {freelancer.client.split(' ')[0] || 'New'}
                    </div>
                    <div className="text-xs text-gray-medium">Rating</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <ClockIcon className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                    <div className="text-lg font-bold text-gray-dark">24h</div>
                    <div className="text-xs text-gray-medium">Response Time</div>
                  </div>
                </div>

                {/* About Section */}
                <div>
                  <h3 className="heading-4 mb-3 flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-primary" />
                    About
                  </h3>
                  <p className="text-gray-medium leading-relaxed">
                    {freelancer.description || 'Experienced professional ready to help with your projects.'}
                  </p>
                </div>

                {/* Skills Section */}
                {freelancer.skills && freelancer.skills.length > 0 && (
                  <div>
                    <h3 className="heading-4 mb-3">Skills & Expertise</h3>
                    <div className="flex flex-wrap gap-2">
                      {freelancer.skills.map((skill, index) => (
                        <Badge
                          key={index}
                          variant="primary"
                          size="medium"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Portfolio Preview */}
                <div>
                  <h3 className="heading-4 mb-3">Recent Work</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-medium text-sm">Portfolio Item 1</span>
                    </div>
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-medium text-sm">Portfolio Item 2</span>
                    </div>
                  </div>
                </div>

                {/* Reviews Preview */}
                <div>
                  <h3 className="heading-4 mb-3">Client Reviews</h3>
                  <Card className="p-4 bg-gray-50">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                        JD
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-dark">John Doe</span>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <StarIcon
                                key={i}
                                className="w-4 h-4 text-yellow-400 fill-current"
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-medium">
                          "Excellent work quality and great communication. Delivered the project on time and exceeded expectations."
                        </p>
                        <span className="text-xs text-gray-medium mt-1">2 weeks ago</span>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="large"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Close
                  </Button>
                  <Button
                    variant="primary"
                    size="large"
                    onClick={() => onHireFreelancer(freelancer)}
                    className="flex-1"
                  >
                    Hire Freelancer
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default FreelancerProfileModal;