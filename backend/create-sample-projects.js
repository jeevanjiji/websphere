const mongoose = require('mongoose');
const Project = require('./models/Project');
const User = require('./models/User');

const createSampleProjects = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/websphere');
    console.log('✅ Connected to MongoDB');

    // Find a client user to associate projects with
    const client = await User.findOne({ role: 'client' });
    if (!client) {
      console.log('❌ No client found. Please create a client user first.');
      return;
    }

    console.log(`👤 Using client: ${client.fullName} (${client.email})`);

    // Sample projects with different categories
    const sampleProjects = [
      {
        title: "Modern E-commerce Website Design",
        description: "Need a talented UI/UX designer to create a modern, responsive e-commerce website design. The design should include homepage, product pages, cart, and checkout flow. Must be mobile-friendly and follow current design trends.",
        category: "ui-ux-design",
        categoryName: "UI/UX Design",
        skills: ["UI/UX Design", "Figma", "Prototyping", "Mobile Design", "Web Design"],
        budgetType: "fixed",
        budgetAmount: 3500,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        client: client._id
      },
      {
        title: "React Frontend Development for SaaS Platform",
        description: "Looking for an experienced React developer to build the frontend of our SaaS platform. The project includes building reusable components, implementing responsive design, and integrating with REST APIs.",
        category: "frontend-development", 
        categoryName: "Frontend Development",
        skills: ["React", "JavaScript", "CSS", "HTML", "Responsive Design"],
        budgetType: "fixed",
        budgetAmount: 5000,
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        client: client._id
      },
      {
        title: "Node.js API Development",
        description: "Need a backend developer to create RESTful APIs using Node.js and Express. The API should handle user authentication, data management, and third-party integrations. Experience with MongoDB required.",
        category: "backend-development",
        categoryName: "Backend Development", 
        skills: ["Node.js", "Express", "MongoDB", "REST API", "Authentication"],
        budgetType: "fixed",
        budgetAmount: 4200,
        deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 35 days from now
        client: client._id
      },
      {
        title: "Mobile App Development for iOS and Android",
        description: "Seeking a mobile app developer to create a cross-platform mobile application. The app should work on both iOS and Android, include push notifications, and have offline functionality.",
        category: "mobile-app-development",
        categoryName: "Mobile App Development",
        skills: ["React Native", "Mobile Development", "iOS", "Android", "Push Notifications"],
        budgetType: "fixed", 
        budgetAmount: 7500,
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        client: client._id
      },
      {
        title: "Full-Stack Web Application Development",
        description: "Need a full-stack developer to build a complete web application from scratch. The project includes both frontend and backend development, database design, and deployment. MERN stack preferred.",
        category: "full-stack-development",
        categoryName: "Full Stack Development",
        skills: ["React", "Node.js", "MongoDB", "Express", "Full Stack"],
        budgetType: "fixed",
        budgetAmount: 8000,
        deadline: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000), // 75 days from now
        client: client._id
      },
      {
        title: "Data Analysis and Machine Learning Project",
        description: "Looking for a data scientist to analyze our customer data and build predictive models. The project involves data cleaning, exploratory analysis, and implementing machine learning algorithms.",
        category: "data-science",
        categoryName: "Data Science",
        skills: ["Python", "Machine Learning", "Data Analysis", "Pandas", "Scikit-learn"],
        budgetType: "fixed",
        budgetAmount: 6000,
        deadline: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000), // 50 days from now
        client: client._id
      },
      {
        title: "Digital Marketing Campaign Management",
        description: "Need a digital marketing expert to manage our online marketing campaigns. This includes SEO optimization, social media management, content creation, and performance tracking.",
        category: "digital-marketing",
        categoryName: "Digital Marketing",
        skills: ["SEO", "Social Media Marketing", "Content Marketing", "Google Ads", "Analytics"],
        budgetType: "fixed",
        budgetAmount: 2500,
        deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000), // 40 days from now
        client: client._id
      },
      {
        title: "Brand Identity and Logo Design",
        description: "Seeking a creative graphic designer to develop a complete brand identity including logo, color palette, typography, and brand guidelines. Experience in brand design essential.",
        category: "graphic-design",
        categoryName: "Graphic Design",
        skills: ["Logo Design", "Brand Identity", "Illustrator", "Photoshop", "Creative Design"],
        budgetType: "fixed",
        budgetAmount: 1800,
        deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
        client: client._id
      },
      {
        title: "Content Writing for Tech Blog",
        description: "Looking for a skilled content writer to create engaging blog posts for our technology website. Topics include software development, AI, and digital trends. SEO knowledge required.",
        category: "content-writing", 
        categoryName: "Content Writing",
        skills: ["Content Writing", "SEO Writing", "Blog Writing", "Technical Writing", "Research"],
        budgetType: "fixed",
        budgetAmount: 1200,
        deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        client: client._id
      },
      {
        title: "WordPress Website Redesign",
        description: "Need to redesign our existing WordPress website with a modern look and improved functionality. Should be responsive, fast-loading, and SEO-friendly.",
        category: "frontend-development",
        categoryName: "Frontend Development",
        skills: ["WordPress", "PHP", "CSS", "HTML", "Responsive Design"],
        budgetType: "fixed",
        budgetAmount: 2200,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        client: client._id
      }
    ];

    // Delete existing sample projects to avoid duplicates
    await Project.deleteMany({ title: { $in: sampleProjects.map(p => p.title) } });

    // Create the projects
    const createdProjects = await Project.create(sampleProjects);
    
    console.log(`\n🎉 Successfully created ${createdProjects.length} sample projects:`);
    createdProjects.forEach((project, index) => {
      console.log(`   ${index + 1}. ${project.title} (${project.categoryName}) - Rs.${project.budgetAmount}`);
    });

    // Display category breakdown
    const categoryCount = {};
    createdProjects.forEach(project => {
      categoryCount[project.categoryName] = (categoryCount[project.categoryName] || 0) + 1;
    });

    console.log('\n📊 Projects by category:');
    Object.entries(categoryCount).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} projects`);
    });

  } catch (error) {
    console.error('❌ Error creating sample projects:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
};

createSampleProjects();