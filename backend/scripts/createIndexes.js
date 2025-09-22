// backend/scripts/createIndexes.js
const mongoose = require('mongoose');
require('dotenv').config();

// Import models to ensure schemas are loaded
const User = require('../models/User');
const Project = require('../models/Project');
const Application = require('../models/Application');
const Workspace = require('../models/Workspace');
const { Chat, Message } = require('../models/Chat');
const Milestone = require('../models/Milestone');
const Deliverable = require('../models/Deliverable');
const WorkspaceFile = require('../models/WorkspaceFile');

const createIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🔧 Creating database indexes for optimal performance...');

    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ googleId: 1 }, { sparse: true });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ skills: 1 });
    await User.collection.createIndex({ 'location.city': 1, 'location.country': 1 });
    await User.collection.createIndex({ createdAt: -1 });
    await User.collection.createIndex({ isActive: 1, role: 1 });
    console.log('✅ User indexes created');

    // Project indexes  
    await Project.collection.createIndex({ client: 1, status: 1 });
    await Project.collection.createIndex({ status: 1, createdAt: -1 });
    await Project.collection.createIndex({ skillsRequired: 1 });
    await Project.collection.createIndex({ category: 1 });
    await Project.collection.createIndex({ budgetRange: 1 });
    await Project.collection.createIndex({ deadline: 1 });
    await Project.collection.createIndex({ 
      title: 'text', 
      description: 'text' 
    }, { 
      weights: { title: 2, description: 1 },
      name: 'project_search_index'
    });
    console.log('✅ Project indexes created');

    // Application indexes
    await Application.collection.createIndex({ project: 1, freelancer: 1 }, { unique: true });
    await Application.collection.createIndex({ freelancer: 1, status: 1 });
    await Application.collection.createIndex({ project: 1, status: 1 });
    await Application.collection.createIndex({ createdAt: -1 });
    console.log('✅ Application indexes created');

    // Workspace indexes
    await Workspace.collection.createIndex({ client: 1, freelancer: 1 });
    await Workspace.collection.createIndex({ project: 1 }, { unique: true });
    await Workspace.collection.createIndex({ status: 1 });
    await Workspace.collection.createIndex({ lastActivity: -1 });
    console.log('✅ Workspace indexes created');

    // Chat indexes
    await Chat.collection.createIndex({ workspace: 1 });
    await Chat.collection.createIndex({ 'participants.user': 1 });
    await Chat.collection.createIndex({ lastMessage: -1 });
    await Chat.collection.createIndex({ createdAt: -1 });
    console.log('✅ Chat indexes created');

    // Message indexes
    await Message.collection.createIndex({ chat: 1, createdAt: -1 });
    await Message.collection.createIndex({ sender: 1 });
    await Message.collection.createIndex({ messageType: 1 });
    console.log('✅ Message indexes created');

    // Milestone indexes
    await Milestone.collection.createIndex({ workspace: 1 });
    await Milestone.collection.createIndex({ workspace: 1, status: 1 });
    await Milestone.collection.createIndex({ dueDate: 1 });
    await Milestone.collection.createIndex({ createdAt: -1 });
    console.log('✅ Milestone indexes created');

    // Deliverable indexes
    await Deliverable.collection.createIndex({ workspace: 1 });
    await Deliverable.collection.createIndex({ milestone: 1 });
    await Deliverable.collection.createIndex({ submittedBy: 1 });
    await Deliverable.collection.createIndex({ status: 1 });
    await Deliverable.collection.createIndex({ submittedAt: -1 });
    console.log('✅ Deliverable indexes created');

    // WorkspaceFile indexes
    await WorkspaceFile.collection.createIndex({ workspace: 1 });
    await WorkspaceFile.collection.createIndex({ uploadedBy: 1 });
    await WorkspaceFile.collection.createIndex({ fileType: 1 });
    await WorkspaceFile.collection.createIndex({ folder: 1 });
    await WorkspaceFile.collection.createIndex({ uploadedAt: -1 });
    await WorkspaceFile.collection.createIndex({ tags: 1 });
    console.log('✅ WorkspaceFile indexes created');

    // Compound indexes for common queries
    await User.collection.createIndex({ role: 1, isActive: 1, createdAt: -1 });
    await Project.collection.createIndex({ status: 1, skillsRequired: 1, budgetRange: 1 });
    await Application.collection.createIndex({ project: 1, status: 1, createdAt: -1 });
    await Workspace.collection.createIndex({ status: 1, lastActivity: -1 });
    console.log('✅ Compound indexes created');

    console.log('🎉 All database indexes created successfully!');
    console.log('📊 Database is now optimized for production queries');

  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run if called directly
if (require.main === module) {
  createIndexes();
}

module.exports = createIndexes;