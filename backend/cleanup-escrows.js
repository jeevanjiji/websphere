require('dotenv').config();
const mongoose = require('mongoose');
const Escrow = require('./models/Escrow');
const Milestone = require('./models/Milestone');

async function cleanupIncompleteEscrows() {
  try {
    console.log('🔄 Connecting to database...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/websphere');
    
    console.log('✅ Connected to database');
    console.log('🧹 Cleaning up incomplete escrow records...');
    
    // Find and delete pending/cancelled escrows
    const incompleteEscrows = await Escrow.find({
      status: { $in: ['pending', 'cancelled'] }
    });
    
    console.log(`📊 Found ${incompleteEscrows.length} incomplete escrow records`);
    
    for (const escrow of incompleteEscrows) {
      // Reset milestone escrow status
      await Milestone.updateOne(
        { _id: escrow.milestone },
        {
          $set: {
            escrowStatus: 'none',
            paymentStatus: 'pending'
          },
          $unset: {
            totalAmountPaid: 1,
            paymentId: 1
          }
        }
      );
      
      // Delete incomplete escrow
      await Escrow.deleteOne({ _id: escrow._id });
      
      console.log(`🗑️ Cleaned up escrow ${escrow._id} for milestone ${escrow.milestone}`);
    }
    
    console.log('✅ Cleanup completed successfully');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📤 Database connection closed');
    process.exit(0);
  }
}

cleanupIncompleteEscrows();