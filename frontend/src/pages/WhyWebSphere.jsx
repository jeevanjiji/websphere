import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  ArrowRightIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Button } from '../components/ui';

const WhyWebSphere = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      navigate('/register');
      return;
    }
    if (user.role === 'admin') {
      navigate('/admin-dashboard');
    } else if (user.role === 'client') {
      navigate('/client');
    } else if (user.role === 'freelancer') {
      navigate('/freelancer');
    } else {
      navigate('/register');
    }
  };

  const features = [
    {
      title: 'Secure Payments',
      description: 'Protected transactions with milestone-based payments and dispute resolution',
      icon: ShieldCheckIcon,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: 'Global Opportunities',
      description: 'Access projects from clients worldwide and expand your market reach',
      icon: GlobeAltIcon,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: 'Fair Pricing',
      description: 'Competitive rates with transparent pricing and no hidden fees',
      icon: CurrencyRupeeIcon,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: '24/7 Support',
      description: 'Round-the-clock customer support to help you succeed',
      icon: ChatBubbleLeftRightIcon,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: 'Quality Clients',
      description: 'Verified clients with genuine projects and fair budgets',
      icon: UserGroupIcon,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: 'Fast Matching',
      description: 'AI-powered matching system connects you with relevant projects quickly',
      icon: ClockIcon,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
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
      gradient: 'from-primary to-accent'
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
      gradient: 'from-primary to-accent'
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
              Why Choose
              <span className="block text-primary">WebSphere</span>
              for your business?
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="body-large mb-12 max-w-3xl mx-auto"
            >
              The most trusted platform for freelancers and clients worldwide. Join thousands who have already transformed their work experience with WebSphere.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
            >
              <Button
                onClick={handleGetStarted}
                variant="primary"
                size="large"
              >
                Get Started
              </Button>
              <Button
                variant="outline"
                size="large"
                icon={<PlayIcon />}
                onClick={() => window.open('https://youtu.be/-VaJNh5bwhM', '_blank')}
              >
                Watch Demo
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              className="heading-2 mb-4"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              Trusted by Thousands
            </motion.h2>
            <motion.p
              className="body-large max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Join a thriving community of freelancers and clients who choose WebSphere for their projects
            </motion.p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-primary mb-2">{stat.number}</div>
                <div className="text-lg font-semibold text-gray-dark mb-1">{stat.label}</div>
                <div className="text-sm text-gray-medium">{stat.description}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              className="heading-2 mb-4"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              What Makes WebSphere Special
            </motion.h2>
            <motion.p
              className="body-large max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              We've built a platform that puts both freelancers and clients first, with features designed to ensure success for everyone
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-border"
              >
                <div className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center mb-6`}>
                  <feature.icon className={`h-8 w-8 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-dark mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-medium leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              className="heading-2 mb-4"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              Benefits for Everyone
            </motion.h2>
            <motion.p
              className="body-large max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Whether you're looking to hire or get hired, WebSphere has you covered
            </motion.p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, x: index === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl shadow-lg p-8"
              >
                <div className={`bg-gradient-to-r ${benefit.gradient} text-white p-6 rounded-2xl mb-6`}>
                  <div className="flex items-center">
                    <span className="text-4xl mr-4">{benefit.icon}</span>
                    <h3 className="text-2xl font-bold">{benefit.title}</h3>
                  </div>
                </div>
                
                <ul className="space-y-4">
                  {benefit.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start">
                      <CheckCircleIcon className="h-6 w-6 text-primary mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-gray-medium">{item}</span>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              className="heading-2 mb-4"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              What Our Community Says
            </motion.h2>
            <motion.p
              className="body-large max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Real stories from real people who have found success on WebSphere
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-bg-secondary rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-warning fill-current" />
                  ))}
                </div>
                <p className="text-gray-medium mb-6 leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <span className="text-3xl mr-4">{testimonial.avatar}</span>
                  <div>
                    <div className="font-semibold text-gray-dark">{testimonial.name}</div>
                    <div className="text-sm text-gray-medium">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2
            className="heading-2 text-white mb-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Ready to Experience the WebSphere Advantage?
          </motion.h2>
          <motion.p
            className="body-large text-white/90 mb-12 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Join thousands of successful freelancers and clients who have made WebSphere their platform of choice
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              onClick={handleGetStarted}
              variant="secondary"
              size="large"
              className="bg-white text-primary hover:bg-gray-lighter"
            >
              Get Started Today
            </Button>
            <Button
              variant="ghost"
              size="large"
              className="text-white hover:bg-white/10"
              onClick={() => navigate('/find-work')}
            >
              Browse Projects
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default WhyWebSphere;
