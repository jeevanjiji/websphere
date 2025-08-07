import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import ProjectCards from '../components/ProjectCards';
import HowItWorks from '../components/HowItWorks';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';

const TestimonialsSection = () => {
  const testimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Startup Founder",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
      content: "WebSphere helped me find the perfect developers for my startup. The quality of talent is exceptional!",
      rating: 5
    },
    {
      id: 2,
      name: "Raj Patel",
      role: "Freelance Designer",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      content: "As a freelancer, WebSphere has been a game-changer. I've found consistent work and amazing clients.",
      rating: 5
    },
    {
      id: 3,
      name: "Lisa Chen",
      role: "Tech Company CEO",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      content: "The AI-powered matching on WebSphere saved us weeks of searching. Highly recommended!",
      rating: 5
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            className="text-4xl font-bold text-gray-900 mb-4"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            What Our Users Say
          </motion.h2>
          <motion.p
            className="text-xl text-gray-600 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Join thousands of satisfied clients and freelancers
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              className="bg-gray-50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center mb-6">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-16 h-16 rounded-full object-cover mr-4"
                />
                <div>
                  <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                  <p className="text-gray-600 text-sm">{testimonial.role}</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-4">"{testimonial.content}"</p>
              
              <div className="flex text-yellow-400">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                  </svg>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();

  // Check if user is logged in and redirect accordingly
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Only redirect if user explicitly navigates to tabs/features
    // This effect runs on mount, but doesn't auto-redirect
    // Redirection happens when user clicks on tabs (handled in components)
  }, []);

  // Function to handle tab clicks - redirect based on user role
  const handleTabClick = (tabType) => {
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user) {
      // Not logged in, redirect to login
      navigate('/login');
      return;
    }

    // Redirect based on user role
    if (user.role === 'admin') {
      navigate('/admin-dashboard');
    } else if (user.role === 'client') {
      navigate('/client');
    } else if (user.role === 'freelancer') {
      navigate('/freelancer');
    }
  };

  return (
    <div className="landing-page">
      <Navbar />
      <Hero onTabClick={handleTabClick} />
      <ProjectCards onCardClick={handleTabClick} />
      <TestimonialsSection /> {/* Add this new section */}
      <HowItWorks onTabClick={handleTabClick} />
      <Footer />
    </div>
  );
};

export default LandingPage;
