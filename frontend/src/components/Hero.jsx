import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon, PlayIcon } from '@heroicons/react/24/outline';
import { Button } from './ui';

const Hero = () => {
  return (
    <section className="relative min-h-screen bg-white flex items-center justify-center overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-32 right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/3 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="heading-1 mb-6">
            Find the perfect
            <span className="block text-primary">freelance services</span>
            for your business
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="body-large mb-12 max-w-3xl mx-auto"
          >
            Millions of people use WebSphere to turn their ideas into reality. Join the world's work marketplace and connect with top talent.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            <Button
              as={Link}
              to="/register"
              variant="primary"
              size="large"
            >
              Get Started
            </Button>
            <Button
              variant="outline"
              size="large"
              icon={<PlayIcon />}
            >
              Watch Demo
            </Button>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-light" />
              <input
                type="text"
                placeholder="Try 'building mobile app'"
                className="w-full pl-12 pr-4 py-4 rounded-lg text-lg border border-gray-border focus:ring-2 focus:ring-primary focus:border-primary shadow-lg"
              />
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              <span className="text-gray-medium text-sm mr-2">Popular:</span>
              {['Website Design', 'WordPress', 'Logo Design', 'AI Services'].map((tag) => (
                <button
                  key={tag}
                  className="px-3 py-1 bg-gray-lighter text-gray-dark rounded-full text-sm hover:bg-primary hover:text-white cursor-pointer transition-all duration-200"
                >
                  {tag}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
