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

// Upload image to Cloudinary
const uploadToCloudinary = async (fileBuffer, options = {}) => {
  try {
    const {
      folder = 'websphere',
      transformation = {},
      resourceType = 'image',
      format = 'auto',
      quality = 'auto'
    } = options;

    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          format,
          quality,
          transformation: {
            fetch_format: 'auto',
            quality: 'auto',
            ...transformation
          },
          ...options
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(fileBuffer);
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
