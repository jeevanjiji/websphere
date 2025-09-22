const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const { uploadSingleWorkspaceFile, handleMulterError } = require('../middlewares/upload');
const cloudinary = require('../utils/cloudinaryConfig');
const WorkspaceFile = require('../models/WorkspaceFile');
const Workspace = require('../models/Workspace');

// Middleware to check workspace access
const checkWorkspaceAccess = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Check if user has access to this workspace
    const isClient = workspace.client.toString() === req.user.id;
    const isFreelancer = workspace.freelancer.toString() === req.user.id;

    if (!isClient && !isFreelancer) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this workspace'
      });
    }

    req.workspace = workspace;
    next();
  } catch (error) {
    console.error('❌ Workspace access check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during access check'
    });
  }
};

// GET /api/files/workspaces/:workspaceId/download/:fileId - Download file
router.get('/workspaces/:workspaceId/download/:fileId', auth(['client', 'freelancer']), checkWorkspaceAccess, async (req, res) => {
  try {
    const { fileId } = req.params;

    console.log('🔥 DOWNLOAD FILE - ID:', fileId);

    const file = await WorkspaceFile.findOne({ 
      _id: fileId, 
      workspace: req.params.workspaceId,
      status: 'active'
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Update download count
    file.downloadCount += 1;
    file.lastDownloaded = new Date();
    await file.save();

    console.log('✅ File download initiated');
    
    // Redirect to Cloudinary URL for download
    res.redirect(file.url);
    
  } catch (error) {
    console.error('❌ Error downloading file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download file',
      error: error.message
    });
  }
});

// DELETE /api/files/workspaces/:workspaceId/:fileId - Delete file
router.delete('/workspaces/:workspaceId/:fileId', auth(['client', 'freelancer']), checkWorkspaceAccess, async (req, res) => {
  try {
    const { fileId } = req.params;

    console.log('🔥 DELETE FILE - ID:', fileId);

    const file = await WorkspaceFile.findOne({ 
      _id: fileId, 
      workspace: req.params.workspaceId,
      status: 'active'
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check if user can delete (file owner or client)
    const canDelete = file.uploadedBy.toString() === req.user.id || 
                     req.workspace.client.toString() === req.user.id;

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied to delete this file'
      });
    }

    // Soft delete - mark as deleted
    file.status = 'deleted';
    file.deletedAt = new Date();
    file.deletedBy = req.user.id;
    await file.save();

    // Optionally delete from Cloudinary
    if (file.publicId) {
      try {
        await cloudinary.uploader.destroy(file.publicId);
        console.log('✅ File deleted from Cloudinary');
      } catch (cloudinaryError) {
        console.warn('⚠️  Failed to delete from Cloudinary:', cloudinaryError.message);
      }
    }

    // Update workspace stats
    await Workspace.findByIdAndUpdate(req.params.workspaceId, {
      $inc: { 'stats.totalFiles': -1 },
      lastActivity: new Date()
    });

    console.log('✅ File deleted successfully');
    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: error.message
    });
  }
});

// PUT /api/files/workspaces/:workspaceId/:fileId - Update file metadata
router.put('/workspaces/:workspaceId/:fileId', auth(['client', 'freelancer']), checkWorkspaceAccess, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { folder, description, tags, permissions } = req.body;

    console.log('🔥 UPDATE FILE METADATA - ID:', fileId);

    const file = await WorkspaceFile.findOne({ 
      _id: fileId, 
      workspace: req.params.workspaceId,
      status: 'active'
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check if user can edit (file owner or client)
    const canEdit = file.uploadedBy.toString() === req.user.id || 
                   req.workspace.client.toString() === req.user.id;

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied to edit this file'
      });
    }

    // Update allowed fields
    if (folder !== undefined) file.folder = folder;
    if (description !== undefined) file.description = description;
    if (tags !== undefined) file.tags = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
    if (permissions !== undefined) {
      file.permissions = {
        ...file.permissions,
        ...permissions
      };
    }

    await file.save();
    await file.populate('uploadedBy', 'fullName profilePicture');

    console.log('✅ File metadata updated successfully');
    res.json({
      success: true,
      message: 'File metadata updated successfully',
      data: file
    });
  } catch (error) {
    console.error('❌ Error updating file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update file',
      error: error.message
    });
  }
});

// POST /api/files/workspaces/:workspaceId/:fileId/version - Upload new version of file
router.post('/workspaces/:workspaceId/:fileId/version', 
  auth(['client', 'freelancer']), 
  checkWorkspaceAccess,
  uploadSingleWorkspaceFile,
  async (req, res) => {
    try {
      const { fileId } = req.params;
      const { versionNotes } = req.body;
      const newFile = req.file;

      console.log('🔥 UPLOAD FILE VERSION - ID:', fileId);

      if (!newFile) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const originalFile = await WorkspaceFile.findOne({ 
        _id: fileId, 
        workspace: req.params.workspaceId,
        status: 'active'
      });

      if (!originalFile) {
        return res.status(404).json({
          success: false,
          message: 'Original file not found'
        });
      }

      // Check if user can upload version (file owner or client)
      const canUploadVersion = originalFile.uploadedBy.toString() === req.user.id || 
                              req.workspace.client.toString() === req.user.id;

      if (!canUploadVersion) {
        return res.status(403).json({
          success: false,
          message: 'Permission denied to upload new version'
        });
      }

      // Add version to file
      const newVersion = {
        version: originalFile.versions.length + 1,
        filename: newFile.filename,
        url: newFile.path,
        publicId: newFile.public_id,
        size: newFile.size,
        uploadedBy: req.user.id,
        uploadedAt: new Date(),
        notes: versionNotes
      };

      originalFile.versions.push(newVersion);
      
      // Update current file info to latest version
      originalFile.filename = newFile.filename;
      originalFile.url = newFile.path;
      originalFile.publicId = newFile.public_id;
      originalFile.size = newFile.size;
      originalFile.currentVersion = newVersion.version;

      await originalFile.save();
      await originalFile.populate('uploadedBy', 'fullName profilePicture');

      console.log('✅ File version uploaded successfully');
      res.status(201).json({
        success: true,
        message: 'New file version uploaded successfully',
        data: originalFile
      });
    } catch (error) {
      console.error('❌ Error uploading file version:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload file version',
        error: error.message
      });
    }
  }
);

// GET /api/files/workspaces/:workspaceId/folders - Get folder structure
router.get('/workspaces/:workspaceId/folders', auth(['client', 'freelancer']), checkWorkspaceAccess, async (req, res) => {
  try {
    console.log('🔥 GET FOLDER STRUCTURE - Workspace:', req.params.workspaceId);

    const folders = await WorkspaceFile.aggregate([
      { 
        $match: { 
          workspace: req.workspace._id, 
          status: 'active' 
        } 
      },
      {
        $group: {
          _id: '$folder',
          count: { $sum: 1 },
          totalSize: { $sum: '$size' },
          categories: { $addToSet: '$category' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log('✅ Found', folders.length, 'folders');
    res.json({
      success: true,
      data: folders
    });
  } catch (error) {
    console.error('❌ Error fetching folders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch folder structure',
      error: error.message
    });
  }
});

// GET /api/files/workspaces/:workspaceId/stats - Get file statistics
router.get('/workspaces/:workspaceId/stats', auth(['client', 'freelancer']), checkWorkspaceAccess, async (req, res) => {
  try {
    console.log('🔥 GET FILE STATISTICS - Workspace:', req.params.workspaceId);

    const stats = await WorkspaceFile.aggregate([
      { 
        $match: { 
          workspace: req.workspace._id, 
          status: 'active' 
        } 
      },
      {
        $group: {
          _id: null,
          totalFiles: { $sum: 1 },
          totalSize: { $sum: '$size' },
          totalDownloads: { $sum: '$downloadCount' },
          categories: { $addToSet: '$category' },
          avgFileSize: { $avg: '$size' }
        }
      }
    ]);

    const categoryStats = await WorkspaceFile.aggregate([
      { 
        $match: { 
          workspace: req.workspace._id, 
          status: 'active' 
        } 
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalSize: { $sum: '$size' }
        }
      }
    ]);

    console.log('✅ File statistics calculated');
    res.json({
      success: true,
      data: {
        overview: stats[0] || { totalFiles: 0, totalSize: 0, totalDownloads: 0, categories: [], avgFileSize: 0 },
        byCategory: categoryStats
      }
    });
  } catch (error) {
    console.error('❌ Error calculating file statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate file statistics',
      error: error.message
    });
  }
});

// Add multer error handling middleware
router.use(handleMulterError);

module.exports = router;