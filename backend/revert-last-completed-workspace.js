const mongoose = require('mongoose');
require('dotenv').config();

const Workspace = require('./models/Workspace');
const Project = require('./models/Project');

async function main() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/websphere';
    await mongoose.connect(mongoUri);

    const workspace = await Workspace.findOne({ status: 'completed' })
      .sort({ updatedAt: -1 })
      .populate('project', 'title status')
      .lean();

    if (!workspace) {
      console.log('No completed workspace found to revert.');
      process.exit(0);
    }

    const workspaceId = workspace._id;
    const projectId = workspace.project?._id;

    console.log('Reverting last completed workspace:');
    console.log(`- Workspace: ${workspaceId}`);
    if (workspace.project) {
      console.log(`- Project:   ${projectId} (${workspace.project.title}) status=${workspace.project.status}`);
    } else {
      console.log('- Project:   (not populated / missing)');
    }

    await Workspace.findByIdAndUpdate(
      workspaceId,
      {
        $set: {
          status: 'active',
          actualEndDate: null,
          lastActivity: new Date()
        }
      },
      { new: false }
    );

    if (projectId) {
      const project = await Project.findById(projectId).select('status').lean();
      if (project?.status === 'completed') {
        await Project.findByIdAndUpdate(
          projectId,
          {
            $set: {
              status: 'in_progress'
            }
          },
          { new: false }
        );
        console.log('Project status reverted: completed -> in_progress');
      } else {
        console.log(`Project status not changed (current=${project?.status ?? 'unknown'})`);
      }
    }

    console.log('✅ Revert completed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to revert:', error);
    process.exit(1);
  }
}

main();
