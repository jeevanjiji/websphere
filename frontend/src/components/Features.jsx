import React from 'react';
import { motion } from 'framer-motion';
import { BoltIcon, ChatBubbleLeftRightIcon, ShieldCheckIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';

const features = [
  {
    icon: <BoltIcon className="h-10 w-10 text-accent" />,
    title: "AI-Powered Matching",
    description: "Connect instantly with the best talent or projects using intelligent algorithms.",
  },
  {
    icon: <ChatBubbleLeftRightIcon className="h-10 w-10 text-accent" />,
    title: "Seamless Communication",
    description: "Built-in chat and video tools keep everyone in sync and productive.",
  },
  {
    icon: <ShieldCheckIcon className="h-10 w-10 text-accent" />,
    title: "Secure Payments",
    description: "Safe and fast payout system protecting both clients and freelancers.",
  },
  {
    icon: <DevicePhoneMobileIcon className="h-10 w-10 text-accent" />,
    title: "Mobile Friendly",
    description: "Manage your work and stay connected from any device.",
  },
];

const Features = () => (
  <section className="py-20 bg-gray-50" id="features">
    <div className="max-w-5xl mx-auto px-4">
      <motion.h2 
        className="text-4xl font-bold text-center text-text mb-12"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        Features
      </motion.h2>
      <div className="grid gap-10 md:grid-cols-2">
        {features.map((feature, idx) => (
          <motion.div
            key={idx}
            className="bg-white rounded-xl shadow-md p-8 flex items-start space-x-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
          >
            <div>{feature.icon}</div>
            <div>
              <h3 className="text-xl font-semibold text-text mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Features;
