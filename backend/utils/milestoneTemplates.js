const milestoneTemplates = {
  'frontend-development': {
    name: 'Website/Web App Development',
    description: 'Complete website or web application creation with user-friendly interface',
    milestones: [
      {
        title: 'Project Planning & Setup',
        description: 'Initial setup, planning, and preparation phase - getting everything ready to start building your website',
        percentage: 15,
        requirements: [
          'Set up the project workspace and tools needed for development',
          'Create a detailed plan and timeline for your project',
          'Prepare all necessary documentation and guidelines',
          'Set up version control to track all changes safely',
          'Establish quality standards and best practices'
        ]
      },
      {
        title: 'Design & Layout Creation',
        description: 'Convert your designs into a working, responsive website that looks great on all devices',
        percentage: 25,
        requirements: [
          'Build the visual layout and structure of your website',
          'Create reusable design components for consistency',
          'Implement navigation menus and page routing',
          'Ensure the website works perfectly on mobile phones and tablets',
          'Apply your brand colors, fonts, and styling throughout'
        ]
      },
      {
        title: 'Main Features Development',
        description: 'Build all the core features and functionality that make your website work',
        percentage: 30,
        requirements: [
          'Implement all the main features users will interact with',
          'Add form submissions with proper error checking',
          'Connect to external services and databases as needed',
          'Ensure smooth user experience with proper data management',
          'Add loading indicators and helpful user messages'
        ]
      },
      {
        title: 'Testing & Bug Fixes',
        description: 'Thorough testing to ensure everything works perfectly and fix any issues found',
        percentage: 20,
        requirements: [
          'Test all features thoroughly to catch any bugs',
          'Verify the website works on different browsers',
          'Check website speed and optimize for better performance',
          'Ensure the website is accessible to users with disabilities',
          'Fix any issues discovered during testing'
        ]
      },
      {
        title: 'Launch & Final Delivery',
        description: 'Deploy your website live and provide all necessary documentation and support',
        percentage: 10,
        requirements: [
          'Launch your website to the live server',
          'Set up website monitoring and analytics tracking',
          'Provide user guides and documentation',
          'Give you instructions for updates and maintenance',
          'Final testing to ensure everything works live'
        ]
      }
    ]
  },

  'backend-development': {
    name: 'Server & Database Development',
    description: 'Backend system development to power your application with secure data management',
    milestones: [
      {
        title: 'Database Design & Setup',
        description: 'Design and set up the database system that will store and manage all your data securely',
        percentage: 20,
        requirements: [
          'Design how your data will be structured and organized',
          'Set up the database with proper security and performance',
          'Create the system architecture for your application',
          'Implement user login and security systems',
          'Configure all necessary settings and environments'
        ]
      },
      {
        title: 'Core System Development',
        description: 'Build the main server functionality that powers your application',
        percentage: 35,
        requirements: [
          'Create all the main data operations (create, read, update, delete)',
          'Add data validation to ensure information quality',
          'Implement your business rules and workflows',
          'Set up comprehensive error handling and logging',
          'Add security measures and usage limits'
        ]
      },
      {
        title: 'Advanced Features & Connections',
        description: 'Implement advanced features and connect to external services',
        percentage: 25,
        requirements: [
          'Connect to payment systems, email services, and other external tools',
          'Add file upload and document management features',
          'Set up automated email notifications and alerts',
          'Implement background processing for heavy tasks',
          'Add performance improvements and caching'
        ]
      },
      {
        title: 'Testing & Documentation',
        description: 'Thorough testing and creating guides for future maintenance',
        percentage: 15,
        requirements: [
          'Test all features thoroughly for reliability',
          'Create detailed documentation for future developers',
          'Test system performance under heavy usage',
          'Set up monitoring to track system health',
          'Security review to ensure data protection'
        ]
      },
      {
        title: 'Launch & Production Setup',
        description: 'Deploy your system live with monitoring and backup systems',
        percentage: 5,
        requirements: [
          'Launch your system to the live production server',
          'Set up monitoring and alert systems',
          'Configure data backup and recovery systems',
          'Optimize performance for real-world usage',
          'Final testing in the live environment'
        ]
      }
    ]
  },

  'full-stack-development': {
    name: 'Complete Web Application',
    description: 'Full website/application development including both user interface and server systems',
    milestones: [
      {
        title: 'Project Foundation & Planning',
        description: 'Set up the complete project structure, database, and user login system',
        percentage: 15,
        requirements: [
          'Set up all development tools and project organization',
          'Design how your data will be stored and managed',
          'Create secure user registration and login system',
          'Build the basic project structure and page navigation',
          'Set up automated testing and deployment systems'
        ]
      },
      {
        title: 'Server System Development',
        description: 'Build the backend server that powers your application',
        percentage: 25,
        requirements: [
          'Create all the server endpoints your app needs',
          'Add data validation and comprehensive error handling',
          'Set up database models and how data relates to each other',
          'Implement user permissions and access control',
          'Add system monitoring and activity logging'
        ]
      },
      {
        title: 'User Interface Development',
        description: 'Build the website/app interface that users will interact with',
        percentage: 25,
        requirements: [
          'Create responsive design that works on all devices',
          'Build reusable interface components for consistency',
          'Connect the interface to your server system',
          'Add user-friendly forms with proper validation',
          'Implement any real-time features like chat or notifications'
        ]
      },
      {
        title: 'Advanced Features & Integrations',
        description: 'Add sophisticated features and connect to external services',
        percentage: 20,
        requirements: [
          'Integrate payment processing systems (if needed)',
          'Add file upload and document management capabilities',
          'Connect to external services and APIs your business needs',
          'Set up automated email notifications and alerts',
          'Implement search, filtering, and advanced user features'
        ]
      },
      {
        title: 'Testing, Launch & Optimization',
        description: 'Complete testing, performance optimization, and live deployment',
        percentage: 15,
        requirements: [
          'Comprehensive testing of all features and user flows',
          'Performance optimization and speed improvements',
          'Security review and vulnerability protection',
          'Deploy to live production environment with monitoring',
          'Complete documentation and project handover'
        ]
      }
    ]
  },

  'mobile-app-development': {
    name: 'Mobile App Development',
    description: 'Mobile application development for iOS and Android devices',
    milestones: [
      {
        title: 'App Planning & Setup',
        description: 'Plan your app structure and set up the development environment',
        percentage: 15,
        requirements: [
          'Set up all tools needed to build your mobile app',
          'Design how users will navigate through your app',
          'Plan how your app will manage and store data',
          'Create the basic app structure and organization',
          'Set up systems for testing and app store deployment'
        ]
      },
      {
        title: 'Main App Interface',
        description: 'Build the main screens and user interface of your mobile app',
        percentage: 30,
        requirements: [
          'Create user registration and login screens',
          'Build all the main screens users will see',
          'Ensure the app looks great on different phone sizes',
          'Add user-friendly forms with proper validation',
          'Apply your brand styling and visual theme'
        ]
      },
      {
        title: 'App Features & Connectivity',
        description: 'Add core features and connect your app to backend services',
        percentage: 25,
        requirements: [
          'Connect your app to server systems and databases',
          'Add local storage so the app works without internet',
          'Implement push notifications to engage users',
          'Add camera integration and file sharing features',
          'Ensure basic features work even when offline'
        ]
      },
      {
        title: 'Testing & Device Optimization',
        description: 'Test thoroughly on real devices and optimize performance',
        percentage: 20,
        requirements: [
          'Test your app on various iPhone and Android devices',
          'Optimize app speed and battery usage',
          'Add features specific to iOS and Android platforms',
          'Prepare app store screenshots and descriptions',
          'Conduct user testing to ensure great experience'
        ]
      },
      {
        title: 'App Store Launch',
        description: 'Launch your app on Apple App Store and Google Play Store',
        percentage: 10,
        requirements: [
          'Create compelling app store listings with screenshots',
          'Build final versions ready for app store submission',
          'Submit your app to Apple App Store and Google Play',
          'Set up analytics to track app usage and crashes',
          'Provide user guides and customer support setup'
        ]
      }
    ]
  },

  'ui-ux-design': {
    name: 'User Interface & Experience Design',
    description: 'Complete design of user-friendly and attractive interfaces',
    milestones: [
      {
        title: 'Research & Discovery',
        description: 'Understand your users, competitors, and project requirements',
        percentage: 20,
        requirements: [
          'Interview and survey your target users to understand their needs',
          'Research what competitors are doing well and poorly',
          'Create detailed profiles of your typical users',
          'Map out how users will accomplish their goals',
          'Define clear project scope and timeline'
        ]
      },
      {
        title: 'Structure & Planning',
        description: 'Plan the overall structure and flow of your application',
        percentage: 15,
        requirements: [
          'Organize all content and features logically',
          'Design smooth user journeys through your application',
          'Plan what content goes where and why',
          'Create basic layout sketches of key screens',
          'Validate the structure with you and key stakeholders'
        ]
      },
      {
        title: 'Visual Design & Interactive Mockups',
        description: 'Create beautiful designs and clickable prototypes',
        percentage: 35,
        requirements: [
          'Create beautiful visual designs that represent your brand',
          'Develop a consistent design system with colors, fonts, and styles',
          'Design detailed mockups of all screens and interfaces',
          'Build clickable prototypes to demonstrate user experience',
          'Ensure designs are accessible to users with disabilities'
        ]
      },
      {
        title: 'User Testing & Improvements',
        description: 'Test designs with real users and improve based on feedback',
        percentage: 20,
        requirements: [
          'Test your designs with real users to gather feedback',
          'Analyze how users interact with and understand the design',
          'Make improvements based on user testing results',
          'Validate that the design solves user problems effectively',
          'Prepare final designs ready for development'
        ]
      },
      {
        title: 'Design Handoff & Guidelines',
        description: 'Prepare final designs for developers with complete documentation',
        percentage: 10,
        requirements: [
          'Organize design files for easy developer access',
          'Create detailed specifications with measurements and styles',
          'Document design standards and usage guidelines',
          'Support developers during the building process',
          'Review final implementation to ensure design accuracy'
        ]
      }
    ]
  },

  'data-science': {
    name: 'Data Analysis & Intelligence Project',
    description: 'Complete data analysis project to generate business insights',
    milestones: [
      {
        title: 'Data Gathering & Initial Analysis',
        description: 'Collect all relevant data and understand what you have to work with',
        percentage: 25,
        requirements: [
          'Identify and gather all data sources relevant to your project',
          'Explore your data to understand patterns and relationships',
          'Check data quality and identify any gaps or issues',
          'Set up secure systems to store and access your data',
          'Document what data you have and initial observations'
        ]
      },
      {
        title: 'Data Cleaning & Preparation',
        description: 'Clean and organize your data for accurate analysis',
        percentage: 25,
        requirements: [
          'Clean up messy or incomplete data entries',
          'Handle missing information and unusual data points',
          'Create new data points that will be useful for analysis',
          'Build automated systems to process future data',
          'Verify that cleaned data is accurate and reliable'
        ]
      },
      {
        title: 'Analysis & Model Development',
        description: 'Analyze your data and build predictive models',
        percentage: 30,
        requirements: [
          'Choose the best analysis methods for your specific needs',
          'Build and test multiple analytical approaches',
          'Fine-tune models for the most accurate results',
          'Test models thoroughly to ensure reliability',
          'Compare different approaches to find the best solution'
        ]
      },
      {
        title: 'Results Validation & Optimization',
        description: 'Verify results are accurate and optimize for practical use',
        percentage: 15,
        requirements: [
          'Test final models with fresh data to verify accuracy',
          'Check for any bias or unfairness in the results',
          'Optimize models to work efficiently in real-world conditions',
          'Set up systems to monitor model performance over time',
          'Document any limitations and important assumptions'
        ]
      },
      {
        title: 'Implementation & Reporting',
        description: 'Deploy your solution and create comprehensive business reports',
        percentage: 5,
        requirements: [
          'Implement models in your business environment',
          'Create automated dashboards and reports for ongoing insights',
          'Provide clear documentation of methods and findings',
          'Give actionable recommendations based on the analysis',
          'Set up monitoring to ensure continued accuracy and value'
        ]
      }
    ]
  }
};

module.exports = milestoneTemplates;