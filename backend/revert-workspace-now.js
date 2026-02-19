require('dotenv').config();
const mongoose = require('mongoose');
const Workspace = require('./models/Workspace');
const Project = require('./models/Project');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected. DB:', mongoose.connection.db.databaseName);

    const r1 = await Workspace.updateOne(
      { _id: '6982bfb106619cd24b0952cf' },
      { $set: { status: 'active', actualEndDate: null, lastActivity: new Date() } }
    );
    console.log('Workspace update result:', JSON.stringify(r1));

    const r2 = await Project.updateOne(
      { _id: '6982bb9e95c529dad53af290' },
      { $set: { status: 'in_progress' } }
    );
    console.log('Project update result:', JSON.stringify(r2));

    // Verify
    const ws = await Workspace.findById('6982bfb106619cd24b0952cf').select('status actualEndDate').lean();
    const pj = await Project.findById('6982bb9e95c529dad53af290').select('status').lean();
    console.log('After update — Workspace status:', ws.status, '| actualEndDate:', ws.actualEndDate);
    console.log('After update — Project status:', pj.status);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
