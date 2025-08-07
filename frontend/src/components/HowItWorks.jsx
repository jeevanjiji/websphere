import React from 'react';
import { motion } from 'framer-motion';
import { LightBulbIcon, UserGroupIcon, SparklesIcon } from '@heroicons/react/24/outline';

const steps = [
  {
    icon: <UserGroupIcon className="h-10 w-10 text-accent" />,
    title: "Sign Up",
    desc: "Create your account as a client or freelancer with instant Google signup."
  },
  {
    icon: <SparklesIcon className="h-10 w-10 text-accent" />,
    title: "Post or Find Work",
    desc: "Post a project or browse jobs using advanced AI-matching algorithms."
  },
  {
    icon: <LightBulbIcon className="h-10 w-10 text-accent" />,
    title: "Collaborate Seamlessly",
    desc: "Communicate, manage, and complete work with AI-driven productivity tools."
  }
];

export default function HowItWorks() {
  return (
    <section className="py-20 bg-white" id="why">
      <div className="max-w-5xl mx-auto px-4">
        <motion.h2 
          className="text-4xl font-bold text-center text-text mb-12"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          How It Works
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-12">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              className="bg-gray-50 rounded-xl shadow-md p-8 flex flex-col items-center text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="mb-4">{step.icon}</div>
              <h3 className="text-xl font-semibold text-text mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
