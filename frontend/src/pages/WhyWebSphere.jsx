import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShieldCheckIcon,
  CurrencyRupeeIcon,
  ClockIcon,
  UserGroupIcon,
  GlobeAltIcon,
  ChatBubbleLeftRightIcon,
  TrophyIcon,
  StarIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const WhyWebSphere = () => {
  const features = [
    {
      title: 'Secure Payments',
      description: 'Protected transactions with milestone-based payments and dispute resolution',
      icon: ShieldCheckIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Global Opportunities',
      description: 'Access projects from clients worldwide and expand your market reach',
      icon: GlobeAltIcon,
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Fair Pricing',
      description: 'Competitive rates with transparent pricing and no hidden fees',
      icon: CurrencyRupeeIcon,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
    },
    {
      title: '24/7 Support',
      description: 'Round-the-clock customer support to help you succeed',
      icon: ChatBubbleLeftRightIcon,
      color: 'text-green-700',
      bgColor: 'bg-green-200'
    },
    {
      title: 'Quality Clients',
      description: 'Verified clients with genuine projects and fair budgets',
      icon: UserGroupIcon,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'Fast Matching',
      description: 'AI-powered matching system connects you with relevant projects quickly',
      icon: ClockIcon,
      color: 'text-green-800',
      bgColor: 'bg-green-300'
    }
  ];

  const benefits = [
    {
      title: 'For Freelancers',
      items: [
        'Keep 95% of your earnings (only 5% platform fee)',
        'Get paid weekly with secure payment protection',
        'Access to skill development resources and courses',
        'Professional portfolio builder tools',
        'Direct client communication without intermediaries',
        'Performance analytics and earnings insights'
      ],
      icon: '👨‍💻',
      gradient: 'from-blue-500 to-blue-700'
    },
    {
      title: 'For Clients',
      items: [
        'Access to pre-vetted, skilled freelancers',
        'Project milestone management system',
        'Quality assurance and revision cycles',
        'Dedicated project managers for large projects',
        'Money-back guarantee on unsatisfactory work',
        'Real-time project tracking and updates'
      ],
      icon: '🏢',
      gradient: 'from-green-500 to-green-700'
    }
  ];

  const stats = [
    { number: '50,000+', label: 'Active Users', description: 'Freelancers and clients worldwide' },
    { number: '₹2.5 Cr+', label: 'Total Earnings', description: 'Paid to freelancers to date' },
    { number: '15,000+', label: 'Projects Completed', description: 'Successfully delivered projects' },
    { number: '4.8/5', label: 'Average Rating', description: 'Client satisfaction score' }
  ];

  const testimonials = [
    {
      name: 'Priya Sharma',
      role: 'UI/UX Designer',
      content: 'WebSphere helped me transition from a full-time job to freelancing. The platform is user-friendly and the payment system is reliable.',
      rating: 5,
      avatar: '👩‍💼'
    },
    {
      name: 'Rahul Gupta',
      role: 'Full Stack Developer',
      content: 'I have earned over ₹5 lakhs in my first year on WebSphere. The quality of projects and clients is excellent.',
      rating: 5,
      avatar: '👨‍💻'
    },
    {
      name: 'Sarah Johnson',
      role: 'Digital Marketing Expert',
      content: 'As a client, I found amazing talent on WebSphere. The project management tools made collaboration seamless.',
      rating: 5,
      avatar: '👩‍💼'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
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
              Why Choose <span className="text-green-300">WebSphere</span>?
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl mb-8 text-green-100"
            >
              The most trusted platform for freelancers and clients in India and beyond
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <p className="text-lg text-green-200">
                The most trusted platform for freelancers and clients worldwide
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Trusted by Thousands
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join a thriving community of freelancers and clients who choose WebSphere for their projects
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-green-600 mb-2">{stat.number}</div>
                <div className="text-lg font-semibold text-gray-900 mb-1">{stat.label}</div>
                <div className="text-sm text-gray-600">{stat.description}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Makes WebSphere Special
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We've built a platform that puts both freelancers and clients first, with features designed to ensure success for everyone
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 border border-gray-100"
              >
                <div className={`w-16 h-16 ${feature.bgColor} rounded-lg flex items-center justify-center mb-6`}>
                  <feature.icon className={`h-8 w-8 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Benefits for Everyone
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Whether you're looking to hire or get hired, WebSphere has you covered
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-lg p-8"
              >
                <div className={`bg-gradient-to-r ${benefit.gradient} text-white p-6 rounded-lg mb-6`}>
                  <div className="flex items-center">
                    <span className="text-4xl mr-4">{benefit.icon}</span>
                    <h3 className="text-2xl font-bold">{benefit.title}</h3>
                  </div>
                </div>
                
                <ul className="space-y-4">
                  {benefit.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start">
                      <CheckCircleIcon className="h-6 w-6 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Our Community Says
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Real stories from real people who have found success on WebSphere
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="bg-gray-50 p-6 rounded-xl"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{testimonial.avatar}</span>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-emerald-700">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Experience the WebSphere Advantage?
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            Join thousands of successful freelancers and clients who have made WebSphere their platform of choice
          </p>
          <p className="text-lg text-green-200">
            Use the navbar to get started as a freelancer or to hire talent
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default WhyWebSphere;
