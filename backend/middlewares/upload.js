// backend/middlewares/upload.js
const multer = require('multer');

// Use memory storage for Cloudinary uploads
const storage = multer.memoryStorage();

// File filter for images
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(file.originalname.toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only image files (JPEG, JPG, PNG, GIF, WebP) are allowed!'));
};

// File filter for all file types (for project attachments)
const allFilesFilter = (req, file, cb) => {
  // Allow most common file types
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt|zip|rar|mp4|mov|avi/;
  const extname = allowedTypes.test(file.originalname.toLowerCase());
  
  if (extname) {
    return cb(null, true);
  }
  cb(new Error('File type not allowed!'));
};

// Profile picture upload configuration
const uploadProfilePicture = multer({
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: imageFilter
}).single('profilePicture');

// Portfolio images upload configuration
const uploadPortfolioImages = multer({
  storage: storage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 5 // Max 5 images
  },
  fileFilter: imageFilter
}).array('portfolioImages', 5);

// Project attachments upload configuration
const uploadProjectAttachments = multer({
  storage: storage,
  limits: { 
    fileSize: 20 * 1024 * 1024, // 20MB limit per file
    files: 10 // Max 10 files
  },
  fileFilter: allFilesFilter
}).array('attachments', 10);

// Single image upload (general purpose)
const uploadSingleImage = multer({
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: imageFilter
}).single('image');

// Multiple images upload (general purpose)
const uploadMultipleImages = multer({
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 5 // Max 5 images
  },
  fileFilter: imageFilter
}).array('images', 5);

// Workspace files upload configuration
const uploadWorkspaceFiles = multer({
  storage: storage,
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB limit per file
    files: 10 // Max 10 files
  },
  fileFilter: allFilesFilter
}).array('files', 10);

// Single workspace file upload
const uploadSingleWorkspaceFile = multer({
  storage: storage,
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1
  },
  fileFilter: allFilesFilter
}).single('file');

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(413).json({
          success: false,
          message: 'File too large. Please check the file size limits.'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(413).json({
          success: false,
          message: 'Too many files. Please check the file count limits.'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field.'
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'File upload error: ' + error.message
        });
    }
  }
  
  if (error.message.includes('Only image files') || error.message.includes('File type not allowed')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};

module.exports = {
  uploadProfilePicture,
  uploadPortfolioImages,
  uploadProjectAttachments,
  uploadSingleImage,
  uploadMultipleImages,
  uploadWorkspaceFiles,
  uploadSingleWorkspaceFile,
  handleMulterError
};
