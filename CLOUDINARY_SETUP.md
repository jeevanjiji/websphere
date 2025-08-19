# Cloudinary Setup Guide

This guide will help you set up Cloudinary for image hosting in your WebSphere application.

## Why Cloudinary?

- **Hosting Compatibility**: Local file storage doesn't work on hosting platforms like Heroku, Vercel, or Netlify
- **Automatic Optimization**: Image compression, format conversion, and responsive images
- **CDN Delivery**: Fast global image delivery
- **Transformations**: Automatic resizing, cropping, and quality optimization
- **Free Tier**: 25GB storage and 25GB bandwidth per month

## Setup Steps

### 1. Create a Cloudinary Account

1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Click "Sign Up for Free"
3. Fill in your details and create an account
4. Verify your email address

### 2. Get Your Credentials

1. After logging in, go to your [Dashboard](https://cloudinary.com/console)
2. You'll see your account details at the top:
   - **Cloud Name**: Your unique cloud identifier
   - **API Key**: Your public API key
   - **API Secret**: Your private API secret (click "Reveal" to see it)

### 3. Configure Your Application

1. Copy `backend/.env.example` to `backend/.env` if you haven't already
2. Update the Cloudinary configuration in your `.env` file:

```env
# Replace these with your actual Cloudinary credentials
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

### 4. Test Your Configuration

Run the test script to verify everything is working:

```bash
cd backend
node test-cloudinary.js
```

You should see:
```
✅ Environment Variables: All set
✅ Configuration: Valid
✅ API Connection: Connected
```

## Features Implemented

### Profile Pictures
- **Upload**: Users can upload profile pictures
- **Optimization**: Automatically resized to 400x400px with face detection
- **Format**: Auto-converted to optimal format (WebP, JPEG, etc.)

### Portfolio Images
- **Upload**: Freelancers can upload portfolio images
- **Optimization**: Resized to max 800x600px while maintaining aspect ratio
- **Quality**: Automatic quality optimization

### Project Attachments
- **File Types**: Supports images, PDFs, documents, and more
- **Size Limits**: Up to 20MB per file, 10 files per project
- **Storage**: Organized in folders by type (profiles, portfolio, projects)

## Folder Structure

Your images will be organized in Cloudinary as:
```
websphere/
├── profiles/           # Profile pictures
├── portfolio/          # Portfolio images
└── projects/          # Project attachments
```

## Security Features

- **Secure URLs**: All images served over HTTPS
- **Access Control**: Only authenticated users can upload
- **File Validation**: Type and size restrictions enforced
- **Automatic Cleanup**: Old images deleted when replaced

## Troubleshooting

### Common Issues

1. **"Image upload service not configured"**
   - Check your `.env` file has the correct Cloudinary credentials
   - Restart your server after updating `.env`

2. **"Failed to upload image"**
   - Check your internet connection
   - Verify your Cloudinary credentials are correct
   - Check if you've exceeded your free tier limits

3. **Images not displaying**
   - Check the browser console for CORS errors
   - Verify the image URLs are valid Cloudinary URLs

### Getting Help

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Cloudinary Support](https://support.cloudinary.com/)
- Check the browser console and server logs for error messages

## Next Steps

Once Cloudinary is configured, you can:
1. Test profile picture uploads in the application
2. Upload portfolio images as a freelancer
3. Attach files to projects as a client
4. Deploy your application without worrying about file storage

## Free Tier Limits

Cloudinary's free tier includes:
- **Storage**: 25GB
- **Bandwidth**: 25GB/month
- **Transformations**: 25,000/month
- **Admin API calls**: 500/hour

This is more than enough for development and small to medium applications.
