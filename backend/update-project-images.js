const mongoose = require('mongoose');
const Project = require('./models/Project');

const updateProjectImages = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/websphere');
    console.log('✅ Connected to MongoDB');

    // Category images mapping
    const categoryImages = {
      'ui-ux-design': 'https://images.unsplash.com/photo-1541462608143-67571c6738dd?w=400&h=250&fit=crop&crop=center',
      'frontend-development': 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=250&fit=crop&crop=center',
      'backend-development': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=250&fit=crop&crop=center',
      'mobile-app-development': 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=250&fit=crop&crop=center',
      'full-stack-development': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop&crop=center',
      'data-science': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop&crop=center',
      'digital-marketing': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop&crop=center',
      'graphic-design': 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&h=250&fit=crop&crop=center',
      'content-writing': 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=250&fit=crop&crop=center'
    };

    const defaultImage = 'https://images.unsplash.com/photo-1553028826-f4804a6dba3b?w=400&h=250&fit=crop&crop=center';

    // Find all projects without images
    const projects = await Project.find({
      $or: [
        { image: { $exists: false } },
        { image: null },
        { image: '' }
      ]
    });

    console.log(`\n🔍 Found ${projects.length} projects without images`);

    let updatedCount = 0;
    for (const project of projects) {
      const imageUrl = categoryImages[project.category] || defaultImage;
      
      await Project.updateOne(
        { _id: project._id },
        { image: imageUrl }
      );
      
      updatedCount++;
      console.log(`✅ Updated project "${project.title}" with ${project.category} image`);
    }

    console.log(`\n🎉 Successfully updated ${updatedCount} projects with default images`);

    // Display summary
    const allProjects = await Project.find({});
    const categoryCounts = {};
    
    for (const project of allProjects) {
      const category = project.category || 'uncategorized';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    }

    console.log('\n📊 Project category breakdown:');
    for (const [category, count] of Object.entries(categoryCounts)) {
      console.log(`   ${category}: ${count} projects`);
    }

  } catch (error) {
    console.error('❌ Error updating project images:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
};

updateProjectImages();