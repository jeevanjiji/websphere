import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MagnifyingGlassIcon,
  BriefcaseIcon,
  CurrencyRupeeIcon,
  ClockIcon,
  StarIcon,
  ChevronRightIcon,
  UserGroupIcon,
  GlobeAltIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const FindWork = () => {
  const workCategories = [
    {
      id: 'ui-ux-design',
      name: 'UI/UX Design',
      description: 'Create stunning user interfaces and experiences',
      icon: '🎨',
      jobs: 250,
      avgRate: '₹2,500/project'
    },
    {
      id: 'frontend-development',
      name: 'Frontend Development',
      description: 'Build responsive and interactive websites',
      icon: '💻',
      jobs: 380,
      avgRate: '₹5,000/project'
    },
    {
      id: 'mobile-app-development',
      name: 'Mobile App Development',
      description: 'Develop iOS and Android applications',
      icon: '📱',
      jobs: 200,
      avgRate: '₹15,000/project'
    },
    {
      id: 'full-stack-development',
      name: 'Full Stack Development',
      description: 'End-to-end web application development',
      icon: '⚡',
      jobs: 150,
      avgRate: '₹12,000/project'
    },
    {
      id: 'digital-marketing',
      name: 'Digital Marketing',
      description: 'SEO, social media, and online marketing',
      icon: '📈',
      jobs: 180,
      avgRate: '₹3,500/project'
    },
    {
      id: 'content-writing',
      name: 'Content Writing',
      description: 'Articles, blogs, and copywriting',
      icon: '✍️',
      jobs: 320,
      avgRate: '₹1,500/project'
    },
    {
      id: 'graphic-design',
      name: 'Graphic Design',
      description: 'Visual design and branding',
      icon: '🎭',
      jobs: 210,
      avgRate: '₹2,000/project'
    },
    {
      id: 'data-science',
      name: 'Data Science',
      description: 'Data analysis and machine learning',
      icon: '📊',
      jobs: 90,
      avgRate: '₹8,000/project'
    }
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Create Your Profile',
      description: 'Showcase your skills, experience, and portfolio to attract clients',
      icon: UserGroupIcon
    },
    {
      step: 2,
      title: 'Browse Projects',
      description: 'Find projects that match your expertise and interests',
      icon: MagnifyingGlassIcon
    },
    {
      step: 3,
      title: 'Submit Proposals',
      description: 'Write compelling proposals and set your rates',
      icon: BriefcaseIcon
    },
    {
      step: 4,
      title: 'Get Hired & Work',
      description: 'Collaborate with clients and deliver outstanding results',
      icon: CheckCircleIcon
    }
  ];

  const stats = [
    { label: 'Active Projects', value: '1,500+', icon: BriefcaseIcon },
    { label: 'Freelancers Earning', value: '25,000+', icon: UserGroupIcon },
    { label: 'Countries Served', value: '50+', icon: GlobeAltIcon },
    { label: 'Average Project Value', value: '₹8,500', icon: CurrencyRupeeIcon }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 text-white py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-6xl font-bold mb-6"
            >
              Find Your Next <span className="text-green-300">Opportunity</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl mb-8 text-green-100"
            >
              Connect with clients worldwide and work on projects that match your skills and passion
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <p className="text-lg text-green-200">
                Join thousands of freelancers earning on WebSphere
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <stat.icon className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Explore Work Categories
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Find projects in your area of expertise and start earning today
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workCategories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 cursor-pointer"
              >
                <div className="text-4xl mb-4">{category.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {category.name}
                </h3>
                <p className="text-gray-600 mb-4">{category.description}</p>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>{category.jobs} jobs</span>
                  <span className="font-semibold text-green-600">{category.avgRate}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Getting started is simple. Follow these steps to begin your freelancing journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="text-center"
              >
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <step.icon className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-emerald-700">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Start Your Freelancing Journey?
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Join thousands of freelancers who are already earning on WebSphere
          </p>
          <p className="text-lg text-green-200">
            Use the navbar to login or register and begin your journey
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FindWork;
