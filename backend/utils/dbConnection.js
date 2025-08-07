const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Clear any existing connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Atlas Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
    console.log(`Collection: users`);
    
    // Test the connection
    await testConnection();
    
  } catch (error) {
    console.error('MongoDB Atlas connection error:', error);
    process.exit(1);
  }
};

const testConnection = async () => {
  try {
    const state = mongoose.connection.readyState;
    console.log('Connection state:', {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }[state]);
    
    if (state === 1) {
      console.log('✅ MongoDB Atlas connection is working properly');
      
      // Test by counting documents in users collection
      const User = mongoose.model('User');
      const userCount = await User.countDocuments();
      console.log(`📊 Users collection contains ${userCount} documents`);
    } else {
      console.log('❌ MongoDB Atlas connection issues detected');
    }
  } catch (error) {
    console.error('Connection test failed:', error);
  }
};

module.exports = { connectDB, testConnection };
