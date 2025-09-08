import React from 'react';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, BriefcaseIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { Button } from './ui';

const FreelancerHero = ({ onTabNavigation }) => {
  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <section className="relative bg-white min-h-screen flex items-center">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-32 right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <motion.h1
            className="heading-1 mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Welcome back, {user?.profile?.firstName || user?.username}!
          </motion.h1>

          <motion.p
            className="body-large mb-8 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Find your next project and showcase your skills to clients worldwide
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Button
              variant="primary"
              size="large"
              icon={<MagnifyingGlassIcon />}
              onClick={() => onTabNavigation && onTabNavigation('browse')}
            >
              Find Projects
            </Button>
            <Button
              variant="outline"
              size="large"
              icon={<BriefcaseIcon />}
              onClick={() => onTabNavigation && onTabNavigation('proposals')}
            >
              My Proposals
            </Button>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="bg-white rounded-xl border border-gray-border p-6 text-center shadow-card">
              <div className="text-3xl font-bold text-primary mb-2">1,200+</div>
              <div className="text-gray-medium">Active Projects</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-border p-6 text-center shadow-card">
              <div className="text-3xl font-bold text-primary mb-2">500+</div>
              <div className="text-gray-medium">Clients Hiring</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-border p-6 text-center shadow-card">
              <div className="text-3xl font-bold text-primary mb-2">95%</div>
              <div className="text-gray-medium">Success Rate</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FreelancerHero;
