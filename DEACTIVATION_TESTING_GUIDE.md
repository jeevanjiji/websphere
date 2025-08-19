# Freelancer Deactivation Feature Testing Guide

This guide explains how to test the newly implemented freelancer deactivation functionality.

## Overview

The system now allows admins to deactivate freelancer accounts with an enhanced email notification system that includes:
- Preset deactivation reasons
- Rating-based default messaging for freelancers who fail to maintain a 2.5-star rating
- Detailed email notifications including performance statistics

## Test Users

The following test freelancers have been created with different ratings to test the deactivation feature:

### Freelancers Below Minimum Rating (Should be deactivated)
1. **John Low Rating** - `john.low@test.com`
   - Rating: 2.1/5.0 (5 reviews)
   - Completed Projects: 3
   - Password: `password123`

2. **Jane Below Average** - `jane.below@test.com`
   - Rating: 2.4/5.0 (8 reviews)
   - Completed Projects: 5
   - Password: `password123`

### Freelancers in Good Standing
1. **Bob Good Rating** - `bob.good@test.com`
   - Rating: 4.2/5.0 (12 reviews)
   - Completed Projects: 8
   - Password: `password123`

2. **Mike Marginal** - `mike.marginal@test.com`
   - Rating: 2.5/5.0 (4 reviews) - Exactly at threshold
   - Completed Projects: 2
   - Password: `password123`

3. **Alice No Rating** - `alice.none@test.com`
   - Rating: 0/5.0 (0 reviews) - New user
   - Completed Projects: 0
   - Password: `password123`

## Admin Access

- **Email**: `admin@admin.com`
- **Password**: `admin123`

## How to Test

### Step 1: Login as Admin
1. Go to `http://localhost:5173`
2. Navigate to Login page
3. Login with admin credentials above

### Step 2: Access User Management
1. Go to Admin Dashboard
2. Click on "User Management" tab
3. You should see all the test freelancers listed

### Step 3: Test Deactivation
1. Find a freelancer with low rating (John Low Rating or Jane Below Average)
2. Click the "Deactivate" button next to their name
3. A modal will open with:
   - User information including current rating and project count
   - Preset deactivation reasons
   - Default reason pre-filled for rating-related deactivation
   - Custom reason option

### Step 4: Confirm Deactivation
1. The default reason should be pre-selected: "Low Rating (Below 2.5 stars)"
2. The text area should be pre-filled with: 
   ```
   Failed to maintain minimum rating requirement of 2.5 stars with X freelancing projects.
   ```
3. Click "Deactivate & Send Email"
4. Confirm the action

### Step 5: Verify Email (Development Mode)
Since we're in development mode, check the backend console for the email log:
```
📧 [DEV MODE] Deactivation email would be sent via Brevo to: john.low@test.com
📝 Reason: Failed to maintain minimum rating requirement of 2.5 stars with 3 freelancing projects.
⭐ Rating Info: { currentRating: 2.1, ratingCount: 5, completedProjects: 3 }
```

### Step 6: Verify Database Changes
1. The freelancer should now show as "Inactive" in the user list
2. The deactivation reason should be stored
3. The deactivation timestamp should be recorded

## Features Implemented

### Enhanced Email Template
- Professional HTML email template
- Rating and project statistics included
- Clear explanation of quality standards
- Contact information for appeals

### Preset Deactivation Reasons
1. **Low Rating (Below 2.5 stars)** - Default for rating issues
2. **Poor Work Quality** - For quality complaints
3. **Poor Communication** - For communication issues
4. **Terms of Service Violation** - For policy violations
5. **Custom Reason** - For other cases

### Admin Dashboard Enhancements
- Improved deactivation modal with user details
- Rating and project count display
- Preset reason selection
- Enhanced user information display

### Backend API Enhancements
- Automatic rating-based reason generation
- Enhanced email service with rating information
- Improved logging and error handling
- Professional email templates

## Email Content Example

When a freelancer with low rating is deactivated, they receive an email containing:

- Account deactivation notice
- Current rating and project statistics
- Explanation of minimum rating requirements (2.5 stars)
- Information about what the deactivation means
- Contact information for appeals
- Professional formatting with WebSphere branding

## Reactivation Testing

To test reactivation:
1. Find a deactivated freelancer in the user list
2. Click "Reactivate" button
3. Confirm the action
4. User should become active again

## Production Notes

- In production, actual emails will be sent via Brevo SMTP
- Ensure BREVO_API_KEY and BREVO_SMTP_USER are properly configured
- Email templates are mobile-responsive and professional
- All deactivation actions are logged with timestamps and admin details
