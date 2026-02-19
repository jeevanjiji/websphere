// backend/utils/cloudinaryConfig.js
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Validate Cloudinary configuration
const validateCloudinaryConfig = () => {
  const { cloud_name, api_key, api_secret } = cloudinary.config();
  
  if (!cloud_name || !api_key || !api_secret) {
    console.warn('⚠️ Cloudinary not properly configured - using development mode');
    console.log('💡 To use Cloudinary:');
    console.log('   1. Sign up at https://cloudinary.com');
    console.log('   2. Go to your dashboard to get credentials');
    console.log('   3. Update CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env');
    return false;
  }
  
  console.log('✅ Cloudinary configured successfully');
  return true;
};

// Upload file to Cloudinary
const uploadToCloudinary = async (fileBuffer, options = {}) => {
  try {
    const folder = options.folder || 'websphere';
    const resourceType = options.resource_type || options.resourceType || 'image';
    const transformation = options.transformation || {};
    const format = options.format;
    const quality = options.quality;

    // Avoid forcing image-only defaults for non-image uploads.
    const isImageLike = resourceType === 'image' || resourceType === 'video';

    // Build upload options explicitly to avoid conflicting keys.
    const uploadOptions = {
      ...options,
      folder,
      resource_type: resourceType
    };

    // Only include transformation/format/quality when appropriate.
    if (isImageLike) {
      uploadOptions.transformation = {
        fetch_format: 'auto',
        quality: 'auto',
        ...transformation
      };

      if (format) uploadOptions.format = format;
      if (quality) uploadOptions.quality = quality;
    } else {
      // For raw/auto uploads (PDF/DOC/ZIP/etc), Cloudinary may reject image-specific params.
      delete uploadOptions.transformation;
      delete uploadOptions.format;
      delete uploadOptions.quality;
    }

    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve(result);
        }
      }).end(fileBuffer);
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

// Delete image from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

// Upload profile picture with specific transformations
const uploadProfilePicture = async (fileBuffer, userId) => {
  const options = {
    folder: 'websphere/profiles',
    public_id: `profile_${userId}_${Date.now()}`,
    transformation: {
      width: 400,
      height: 400,
      crop: 'fill',
      gravity: 'face',
      quality: 'auto',
      format: 'auto'
    },
    overwrite: true
  };

  return await uploadToCloudinary(fileBuffer, options);
};

// Upload portfolio image with specific transformations
const uploadPortfolioImage = async (fileBuffer, userId, portfolioIndex) => {
  const options = {
    folder: 'websphere/portfolio',
    public_id: `portfolio_${userId}_${portfolioIndex}_${Date.now()}`,
    transformation: {
      width: 800,
      height: 600,
      crop: 'limit',
      quality: 'auto',
      format: 'auto'
    },
    overwrite: true
  };

  return await uploadToCloudinary(fileBuffer, options);
};

// Upload project attachment
const uploadProjectAttachment = async (fileBuffer, projectId, filename) => {
  const options = {
    folder: 'websphere/projects',
    public_id: `project_${projectId}_${Date.now()}_${filename.split('.')[0]}`,
    resource_type: 'auto', // Allows non-image files
    overwrite: true
  };

  return await uploadToCloudinary(fileBuffer, options);
};

// Get optimized image URL with transformations
const getOptimizedImageUrl = (publicId, transformations = {}) => {
  if (!publicId) return null;
  
  const defaultTransformations = {
    fetch_format: 'auto',
    quality: 'auto'
  };

  return cloudinary.url(publicId, {
    ...defaultTransformations,
    ...transformations
  });
};

// Extract public ID from Cloudinary URL
const extractPublicId = (cloudinaryUrl) => {
  if (!cloudinaryUrl || typeof cloudinaryUrl !== 'string') return null;
  
  try {
    // Extract public ID from Cloudinary URL
    const matches = cloudinaryUrl.match(/\/v\d+\/(.+)\.[^.]+$/);
    return matches ? matches[1] : null;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};

module.exports = {
  cloudinary,
  validateCloudinaryConfig,
  uploadToCloudinary,
  deleteFromCloudinary,
  uploadProfilePicture,
  uploadPortfolioImage,
  uploadProjectAttachment,
  getOptimizedImageUrl,
  extractPublicId
};
