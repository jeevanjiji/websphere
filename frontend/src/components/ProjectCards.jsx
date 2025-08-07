import React from 'react';
import { motion } from 'framer-motion';
import {
  CodeBracketIcon,
  PaintBrushIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { Card, Badge, Button } from './ui';

const ProjectCards = ({ onCardClick }) => {
  const sampleProjects = [
    {
      id: 1,
      title: "E-commerce Website Development",
      description: "Looking for a skilled React developer to build a modern e-commerce platform with payment integration and responsive design.",
      budget: "₹2,00,000 - ₹4,00,000",
      timeline: "2-3 months",
      skills: ["React", "Node.js", "MongoDB", "Stripe"],
      client: "TechCorp Solutions",
      icon: CodeBracketIcon,
      color: "from-blue-500 to-purple-600",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop&crop=center"
    },
    {
      id: 2,
      title: "Mobile App UI/UX Design",
      description: "Need a creative designer to design user interface for a fitness tracking mobile application with modern aesthetics.",
      budget: "₹96,000 - ₹2,00,000",
      timeline: "1-2 months",
      skills: ["Figma", "Adobe XD", "Prototyping", "Mobile Design"],
      client: "FitLife Innovations",
      icon: PaintBrushIcon,
      color: "from-pink-500 to-rose-600",
      image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=200&fit=crop&crop=center"
    },
    {
      id: 3,
      title: "Data Analysis & Visualization",
      description: "Analyze customer data and create interactive dashboards using Python libraries for business insights.",
      budget: "₹64,000 - ₹1,20,000",
      timeline: "3-4 weeks",
      skills: ["Python", "Pandas", "Matplotlib", "Tableau"],
      client: "DataDriven Analytics",
      icon: CurrencyDollarIcon,
      color: "from-green-500 to-emerald-600",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop&crop=center"
    },
    {
      id: 4,
      title: "WordPress Website Redesign",
      description: "Redesign and optimize existing WordPress website for better performance and modern look.",
      budget: "₹48,000 - ₹96,000",
      timeline: "2-3 weeks",
      skills: ["WordPress", "PHP", "CSS", "SEO"],
      client: "Creative Agency Pro",
      icon: CodeBracketIcon,
      color: "from-orange-500 to-red-600",
      image: "https://images.unsplash.com/photo-1547658719-da2b51169166?w=400&h=200&fit=crop&crop=center"
    },
    {
      id: 5,
      title: "Social Media Marketing Campaign",
      description: "Create and manage social media marketing campaign for a new product launch across multiple platforms.",
      budget: "₹80,000 - ₹1,60,000",
      timeline: "1 month",
      skills: ["Social Media", "Content Creation", "Analytics", "Strategy"],
      client: "Marketing Masters",
      icon: PaintBrushIcon,
      color: "from-indigo-500 to-purple-600",
      image: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=200&fit=crop&crop=center"
    },
    {
      id: 6,
      title: "AI Chatbot Development",
      description: "Develop an intelligent chatbot for customer service using natural language processing technologies.",
      budget: "₹2,40,000 - ₹4,80,000",
      timeline: "2-4 months",
      skills: ["Python", "NLP", "Machine Learning", "API Integration"],
      client: "AI Solutions Inc",
      icon: CodeBracketIcon,
      color: "from-cyan-500 to-blue-600",
      image: "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=400&h=200&fit=crop&crop=center"
    }
  ];

  return (
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
            Popular services
          </motion.h2>
          <motion.p
            className="body-large max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Most popular services based on recent sales
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sampleProjects.map((project, index) => {
            const Icon = project.icon;
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card
                  variant="default"
                  padding="none"
                  hover={true}
                  clickable={true}
                  onClick={() => onCardClick('project')}
                  className="overflow-hidden"
                >
                  {/* Service Image */}
                  <div className="h-40 overflow-hidden relative">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-4">
                    {/* Freelancer Info */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-gray-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-dark">{project.client}</span>
                      <div className="ml-auto flex items-center gap-1">
                        <StarIcon className="w-4 h-4 text-warning fill-current" />
                        <span className="text-sm font-medium text-gray-dark">4.9</span>
                        <span className="text-sm text-gray-medium">(127)</span>
                      </div>
                    </div>

                    <h3 className="text-base font-medium text-gray-dark mb-2 line-clamp-2 hover:text-primary transition-colors cursor-pointer">
                      {project.title}
                    </h3>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {project.skills.slice(0, 2).map((skill) => (
                        <Badge
                          key={skill}
                          variant="default"
                          size="small"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <StarIcon className="w-4 h-4 text-warning fill-current" />
                        <span className="text-sm font-medium text-gray-dark">4.9</span>
                        <span className="text-sm text-gray-medium">(127)</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-medium">Starting at</div>
                        <div className="text-lg font-bold text-gray-dark">₹5,000</div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            viewport={{ once: true }}
          >
            <Button
              variant="outline"
              size="large"
              onClick={() => onCardClick('browse')}
            >
              Browse All Services
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ProjectCards;
