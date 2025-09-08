// Reset password for client user to test application
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const newPassword = 'test123';
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update the client user password
    const result = await User.updateOne(
      { email: 'jeevanjiji2026@mca.ajce.in' },
      { password: hashedPassword }
    );

    console.log('🔑 Password reset result:', result);
    console.log('🔑 New password for jeevanjiji2026@mca.ajce.in:', newPassword);

    // Also reset freelancer password
    const freelancerResult = await User.updateOne(
      { email: 'jeevanjiji2003@gmail.com' },
      { password: hashedPassword }
    );

    console.log('🔑 Freelancer password reset result:', freelancerResult);
    console.log('🔑 New password for jeevanjiji2003@gmail.com:', newPassword);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

resetPassword();
