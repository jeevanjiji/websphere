
import React from 'react';
import { motion } from 'framer-motion';

const ProjectListings = () => {
  const projects = [
    {
      title: "E-commerce Website Development",
      budget: "Rs.5,000 - Rs.8,000",
      skills: ["React", "Node.js", "MongoDB"],
      proposals: 12,
      timeAgo: "2 hours ago"
    },
    // Add more projects...
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <motion.h2 
          className="text-4xl font-bold text-center text-text mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Featured Projects
        </motion.h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <motion.div
              key={index}
              className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <h3 className="font-semibold text-lg mb-2">{project.title}</h3>
              <p className="text-accent font-bold mb-3">{project.budget}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {project.skills.map((skill) => (
                  <span key={skill} className="px-2 py-1 bg-gray-100 text-sm rounded">
                    {skill}
                  </span>
                ))}
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{project.proposals} proposals</span>
                <span>{project.timeAgo}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectListings;
