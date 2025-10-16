// backend/jobs/matchingNotifications.js
const cron = require('node-cron');
const MatchingService = require('../services/matchingService');
const NotificationService = require('../services/notificationService');
const User = require('../models/User');
const Project = require('../models/Project');

/**
 * Background job for proactive matching notifications
 * Inspired by production matching systems that send intelligent notifications
 */
class MatchingNotificationJob {
  constructor() {
    this.isRunning = false;
    this.lastRun = null;
  }

  /**
   * Initialize scheduled jobs
   */
  init() {
    // Run every 2 hours during business hours (9 AM - 9 PM)
    cron.schedule('0 9-21/2 * * *', async () => {
      await this.runProactiveMatching();
    });

    // Run daily at 10 AM for new project notifications
    cron.schedule('0 10 * * *', async () => {
      await this.runDailyProjectDigest();
    });

    // Run every Monday at 9 AM for weekly freelancer digest
    cron.schedule('0 9 * * 1', async () => {
      await this.runWeeklyFreelancerDigest();
    });

    console.log('Matching notification jobs initialized');
  }

  /**
   * Main proactive matching job
   * Finds high-quality matches and sends notifications
   */
  async runProactiveMatching() {
    if (this.isRunning) {
      console.log('Matching job already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('Starting proactive matching job...');

    try {
      // Get recently posted projects (last 24 hours)
      const recentProjects = await Project.find({
        status: 'open',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }).lean();

      console.log(`Found ${recentProjects.length} recent projects`);

      for (const project of recentProjects) {
        await this.processProjectMatching(project);
      }

      // Also check for freelancers who might be interested in slightly older projects
      await this.processFreelancerRecommendations();

      this.lastRun = new Date();
      console.log('Proactive matching job completed successfully');

    } catch (error) {
      console.error('Proactive matching job error:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Process matching for a specific project
   */
  async processProjectMatching(project) {
    try {
      // Get top matches for this project
      const matches = await MatchingService.getRecommendedFreelancers(project._id, {
        limit: 10,
        minScore: 0.7 // Only high-quality matches
      });

      if (matches.matches.length === 0) {
        console.log(`No high-quality matches found for project: ${project.title}`);
        return;
      }

      // Send notifications to top matching freelancers
      const topMatches = matches.matches.slice(0, 5); // Top 5 matches

      for (const match of topMatches) {
        await this.sendProjectMatchNotification(match.freelancer, project, match.scores);
      }

      console.log(`Sent ${topMatches.length} match notifications for project: ${project.title}`);

    } catch (error) {
      console.error(`Error processing project matching for ${project._id}:`, error);
    }
  }

  /**
   * Send personalized project match notification
   */
  async sendProjectMatchNotification(freelancer, project, scores) {
    try {
      // Check if freelancer has notification preferences
      const user = await User.findById(freelancer._id);
      if (!user || !user.notificationPreferences?.projectRecommendations) {
        return; // User doesn't want project recommendations
      }

      // Check if we've already notified this freelancer about this project recently
      const recentNotificationKey = `project_match:${project._id}:${freelancer._id}`;
      // In production, use Redis for this check
      
      const notificationData = {
        type: 'project_match',
        title: '🎯 Perfect Project Match Found!',
        message: this.generateMatchMessage(project, scores),
        data: {
          projectId: project._id,
          projectTitle: project.title,
          matchScore: scores.total,
          category: project.category,
          budget: project.budgetAmount,
          budgetType: project.budgetType
        },
        priority: scores.total > 0.9 ? 'high' : 'medium'
      };

      // Send notification through your notification service
      await NotificationService.createNotification(
        freelancer._id,
        notificationData.type,
        notificationData.title,
        notificationData.message,
        notificationData.data
      );

      // Log for analytics
      console.log(`Match notification sent: ${freelancer.fullName} -> ${project.title} (Score: ${scores.total})`);

    } catch (error) {
      console.error('Error sending project match notification:', error);
    }
  }

  /**
   * Process recommendations for active freelancers
   */
  async processFreelancerRecommendations() {
    try {
      // Get freelancers who were active recently but haven't applied to projects
      const activeFreelancers = await User.find({
        role: 'freelancer',
        lastActiveAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Active in last week
        'profile.isAvailable': { $ne: false }
      }).lean();

      console.log(`Processing recommendations for ${activeFreelancers.length} active freelancers`);

      for (const freelancer of activeFreelancers.slice(0, 50)) { // Limit to avoid overwhelming
        await this.processIndividualFreelancerRecommendations(freelancer);
      }

    } catch (error) {
      console.error('Error processing freelancer recommendations:', error);
    }
  }

  /**
   * Process recommendations for individual freelancer
   */
  async processIndividualFreelancerRecommendations(freelancer) {
    try {
      const recommendations = await MatchingService.getRecommendedProjects(freelancer._id, {
        limit: 3 // Top 3 recommendations
      });

      if (recommendations.projects.length === 0) {
        return;
      }

      // Only send if there are high-quality matches
      const highQualityProjects = recommendations.projects.filter(p => p.scores.total > 0.6);
      
      if (highQualityProjects.length > 0) {
        await this.sendFreelancerRecommendationNotification(freelancer, highQualityProjects);
      }

    } catch (error) {
      console.error(`Error processing recommendations for freelancer ${freelancer._id}:`, error);
    }
  }

  /**
   * Send freelancer recommendation notification
   */
  async sendFreelancerRecommendationNotification(freelancer, projects) {
    try {
      const topProject = projects[0];
      
      const notificationData = {
        type: 'project_recommendations',
        title: '💼 New Projects Match Your Skills!',
        message: `We found ${projects.length} project${projects.length > 1 ? 's' : ''} that match your expertise. "${topProject.title}" looks particularly interesting!`,
        data: {
          projectCount: projects.length,
          topProject: {
            id: topProject._id,
            title: topProject.title,
            category: topProject.category,
            matchScore: topProject.scores.total
          }
        }
      };

      await NotificationService.createNotification(
        freelancer._id,
        notificationData.type,
        notificationData.title,
        notificationData.message,
        notificationData.data
      );

    } catch (error) {
      console.error('Error sending freelancer recommendation notification:', error);
    }
  }

  /**
   * Daily digest of new projects
   */
  async runDailyProjectDigest() {
    try {
      console.log('Starting daily project digest...');

      // Get projects posted in the last 24 hours
      const newProjects = await Project.find({
        status: 'open',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }).populate('client', 'fullName').lean();

      if (newProjects.length === 0) {
        console.log('No new projects for daily digest');
        return;
      }

      // Get active freelancers who opted in for daily digests
      const subscribedFreelancers = await User.find({
        role: 'freelancer',
        'notificationPreferences.dailyDigest': true,
        'profile.isAvailable': { $ne: false }
      }).lean();

      console.log(`Sending daily digest to ${subscribedFreelancers.length} freelancers`);

      // Group projects by category for better digest
      const projectsByCategory = this.groupProjectsByCategory(newProjects);

      for (const freelancer of subscribedFreelancers) {
        await this.sendDailyDigestNotification(freelancer, projectsByCategory);
      }

      console.log('Daily project digest completed');

    } catch (error) {
      console.error('Daily project digest error:', error);
    }
  }

  /**
   * Weekly freelancer digest for clients
   */
  async runWeeklyFreelancerDigest() {
    try {
      console.log('Starting weekly freelancer digest...');

      // Get clients with open projects
      const clientsWithProjects = await Project.distinct('client', { 
        status: 'open',
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      });

      for (const clientId of clientsWithProjects) {
        await this.sendWeeklyFreelancerDigest(clientId);
      }

      console.log('Weekly freelancer digest completed');

    } catch (error) {
      console.error('Weekly freelancer digest error:', error);
    }
  }

  // Helper methods

  generateMatchMessage(project, scores) {
    const matchReasons = [];
    
    if (scores.skill > 0.8) matchReasons.push("perfect skill match");
    if (scores.rate > 0.8) matchReasons.push("great rate fit");
    if (scores.portfolio > 0.7) matchReasons.push("relevant portfolio");
    
    const reasonText = matchReasons.length > 0 ? ` - ${matchReasons.join(", ")}` : "";
    
    return `"${project.title}" is a ${Math.round(scores.total * 100)}% match for your skills${reasonText}. Budget: ${project.budgetType === 'hourly' ? '$' + project.budgetAmount + '/hr' : '$' + project.budgetAmount}`;
  }

  groupProjectsByCategory(projects) {
    const grouped = {};
    
    projects.forEach(project => {
      const category = project.category || 'other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(project);
    });
    
    return grouped;
  }

  async sendDailyDigestNotification(freelancer, projectsByCategory) {
    const totalProjects = Object.values(projectsByCategory).flat().length;
    
    // Find categories that match freelancer's skills
    const relevantCategories = Object.entries(projectsByCategory).filter(([category]) => 
      this.isRelevantCategory(category, freelancer.skills || [])
    );

    if (relevantCategories.length === 0) {
      return; // No relevant projects for this freelancer
    }

    const notificationData = {
      type: 'daily_digest',
      title: `📊 Daily Update: ${totalProjects} New Projects`,
      message: `${relevantCategories.length} categories match your skills. Check them out!`,
      data: {
        totalProjects,
        relevantCategories: relevantCategories.length,
        topCategory: relevantCategories[0][0]
      }
    };

    await NotificationService.createNotification(
      freelancer._id,
      notificationData.type,
      notificationData.title,
      notificationData.message,
      notificationData.data
    );
  }

  async sendWeeklyFreelancerDigest(clientId) {
    // Get client's open projects
    const projects = await Project.find({ 
      client: clientId, 
      status: 'open' 
    }).lean();

    for (const project of projects) {
      const analytics = await MatchingService.getMatchingAnalytics(project._id);
      
      // Only notify if there are actionable insights
      if (analytics.recommendations.length > 0) {
        await NotificationService.createNotification(
          clientId,
          'weekly_matching_digest',
          '📈 Weekly Matching Insights',
          `Your project "${project.title}" has ${analytics.statistics.qualifiedFreelancers} qualified freelancers. ${analytics.recommendations[0].message}`,
          {
            projectId: project._id,
            qualifiedFreelancers: analytics.statistics.qualifiedFreelancers,
            topRecommendation: analytics.recommendations[0]
          }
        );
      }
    }
  }

  isRelevantCategory(category, freelancerSkills) {
    const categoryKeywords = {
      'frontend-development': ['react', 'vue', 'angular', 'javascript', 'html', 'css'],
      'backend-development': ['node', 'python', 'java', 'php', 'express'],
      'mobile-app-development': ['react-native', 'flutter', 'ios', 'android'],
      'ui-ux-design': ['figma', 'photoshop', 'sketch', 'ui', 'ux'],
      'full-stack-development': ['react', 'node', 'javascript', 'python']
    };

    const keywords = categoryKeywords[category] || [];
    return keywords.some(keyword => 
      freelancerSkills.some(skill => 
        skill.toLowerCase().includes(keyword.toLowerCase())
      )
    );
  }

  // Manual trigger methods for testing
  async triggerProactiveMatching() {
    return await this.runProactiveMatching();
  }

  async triggerDailyDigest() {
    return await this.runDailyProjectDigest();
  }

  getJobStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      nextScheduledRun: 'Every 2 hours during business hours'
    };
  }
}

module.exports = new MatchingNotificationJob();