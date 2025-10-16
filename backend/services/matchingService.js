// backend/services/matchingService.js
const MatchingEngine = require('./matchingEngine');
const Application = require('../models/Application');
const User = require('../models/User');
const Project = require('../models/Project');

/**
 * High-level service for managing freelancer-project matching
 * Handles caching, analytics, and business logic
 */
class MatchingService {
  constructor() {
    this.matchingEngine = MatchingEngine;
    this.cache = new Map(); // Simple in-memory cache - use Redis in production
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get recommended freelancers for a project
   */
  async getRecommendedFreelancers(projectId, options = {}) {
    try {
      const cacheKey = `matches:${projectId}:${JSON.stringify(options)}`;
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return { ...cached.data, fromCache: true };
        }
      }

      // Get fresh matches
      const matches = await this.matchingEngine.matchFreelancersToProject(projectId, options);
      
      // Filter out freelancers who already applied
      const filteredMatches = await this.filterAppliedFreelancers(matches.matches, projectId);
      
      const result = {
        ...matches,
        matches: filteredMatches,
        fromCache: false
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      // Track analytics
      this.trackMatchingAnalytics(projectId, result);

      return result;

    } catch (error) {
      console.error('MatchingService Error:', error);
      throw new Error('Failed to get recommended freelancers');
    }
  }

  /**
   * Get recommended projects for a freelancer
   */
  async getRecommendedProjects(freelancerId, options = {}) {
    try {
      console.log('🎯 getRecommendedProjects called with:', { freelancerId, options });
      
      const { limit = 10, category = null } = options;

      // Get freelancer profile
      console.log('📋 Fetching freelancer profile for ID:', freelancerId);
      const freelancer = await User.findById(freelancerId).lean();
      
      if (!freelancer) {
        console.log('❌ Freelancer not found in database');
        throw new Error('Freelancer not found');
      }
      
      if (freelancer.role !== 'freelancer') {
        console.log('❌ User is not a freelancer, role:', freelancer.role);
        throw new Error('User is not a freelancer');
      }
      
      console.log('✅ Freelancer found:', { 
        name: freelancer.fullName, 
        skills: freelancer.skills?.length || 0,
        experienceLevel: freelancer.experienceLevel 
      });

      // Build project query based on freelancer profile
      const projectQuery = this.buildProjectQuery(freelancer, category);
      console.log('🔍 Project query built:', projectQuery);
      
      // Get candidate projects
      console.log('📊 Searching for projects...');
      const projects = await Project.find(projectQuery)
        .populate('client', 'fullName profilePicture')
        .lean()
        .limit(limit * 2); // Get more to filter later
      
      console.log('📊 Found', projects.length, 'candidate projects');

      // Score projects for this freelancer
      const scoredProjects = this.scoreProjectsForFreelancer(projects, freelancer);
      
      // Filter out projects freelancer already applied to
      const filteredProjects = await this.filterAppliedProjects(scoredProjects, freelancerId);

      return {
        projects: filteredProjects.slice(0, limit),
        totalAvailable: projects.length,
        freelancerProfile: {
          skills: freelancer.skills,
          experienceLevel: freelancer.experienceLevel,
          hourlyRate: freelancer.hourlyRate
        }
      };

    } catch (error) {
      console.error('MatchingService Error:', error);
      throw new Error('Failed to get recommended projects');
    }
  }

  /**
   * Get matching analytics for a project
   */
  async getMatchingAnalytics(projectId) {
    try {
      const project = await Project.findById(projectId).lean();
      if (!project) {
        throw new Error('Project not found');
      }

      // Get basic match statistics
      const totalFreelancers = await User.countDocuments({ role: 'freelancer' });
      const qualifiedFreelancers = await this.countQualifiedFreelancers(project);
      const applications = await Application.countDocuments({ project: projectId });

      // Get skill analysis
      const skillAnalysis = await this.analyzeSkillAvailability(project.skills || []);

      // Get budget analysis
      const budgetAnalysis = await this.analyzeBudgetCompetitiveness(project);

      return {
        project: {
          title: project.title,
          category: project.category,
          skills: project.skills
        },
        statistics: {
          totalFreelancers,
          qualifiedFreelancers,
          applications,
          matchRate: qualifiedFreelancers > 0 ? (applications / qualifiedFreelancers) : 0
        },
        skillAnalysis,
        budgetAnalysis,
        recommendations: this.generateImprovementRecommendations(project, {
          qualifiedFreelancers,
          applications,
          skillAnalysis,
          budgetAnalysis
        })
      };

    } catch (error) {
      console.error('Analytics Error:', error);
      throw new Error('Failed to get matching analytics');
    }
  }

  /**
   * Batch matching for multiple projects (useful for notifications)
   */
  async batchMatchProjects(projectIds, options = {}) {
    const results = new Map();
    
    for (const projectId of projectIds) {
      try {
        const matches = await this.getRecommendedFreelancers(projectId, options);
        results.set(projectId, matches);
      } catch (error) {
        console.error(`Batch matching failed for project ${projectId}:`, error);
        results.set(projectId, { error: error.message });
      }
    }
    
    return results;
  }

  /**
   * Real-time matching for new freelancer registrations
   */
  async findProjectsForNewFreelancer(freelancerId) {
    try {
      const matches = await this.getRecommendedProjects(freelancerId, { limit: 5 });
      
      // Filter for high-quality matches only (score > 0.7)
      const highQualityMatches = matches.projects.filter(p => p.scores.total > 0.7);
      
      return {
        matches: highQualityMatches,
        shouldNotify: highQualityMatches.length > 0
      };

    } catch (error) {
      console.error('New freelancer matching error:', error);
      return { matches: [], shouldNotify: false };
    }
  }

  // Private helper methods

  async filterAppliedFreelancers(matches, projectId) {
    const appliedFreelancerIds = await Application.distinct('freelancer', { project: projectId });
    const appliedSet = new Set(appliedFreelancerIds.map(id => id.toString()));
    
    return matches.filter(match => 
      !appliedSet.has(match.freelancer._id.toString())
    );
  }

  async filterAppliedProjects(projects, freelancerId) {
    const appliedProjectIds = await Application.distinct('project', { freelancer: freelancerId });
    const appliedSet = new Set(appliedProjectIds.map(id => id.toString()));
    
    return projects.filter(project => 
      !appliedSet.has(project._id.toString())
    );
  }

  buildProjectQuery(freelancer, category = null) {
    const query = {
      status: 'open'
      // Removed deadline restriction to be more inclusive
    };

    // Filter by category if specified
    if (category) {
      query.category = category;
    }

    // Rate filtering based on freelancer's rate (more lenient)
    if (freelancer.hourlyRate && freelancer.hourlyRate > 0) {
      query.$or = [
        { budgetType: 'fixed' }, // Include all fixed projects
        { budgetType: { $ne: 'hourly' } }, // Include projects without hourly type
        { 
          budgetType: 'hourly',
          budgetAmount: { $gte: freelancer.hourlyRate * 0.5 } // 50% of their rate (more lenient)
        }
      ];
    }

    console.log('🔍 Built project query:', JSON.stringify(query, null, 2));
    return query;
  }

  scoreProjectsForFreelancer(projects, freelancer) {
    return projects.map(project => {
      const projectVector = this.matchingEngine.createProjectVector(project);
      const freelancerVector = this.matchingEngine.createFreelancerVector(freelancer);
      
      // Calculate compatibility scores
      const skillScore = this.matchingEngine.calculateSkillSimilarity(
        projectVector.skills, 
        freelancerVector.skills
      );
      
      const rateScore = this.matchingEngine.calculateRateCompatibility(
        freelancer.hourlyRate, 
        project
      );
      
      const portfolioScore = this.matchingEngine.calculatePortfolioRelevance(
        freelancer.portfolio, 
        project
      );
      
      // Simpler scoring for project recommendations
      const totalScore = (skillScore * 0.5) + (rateScore * 0.3) + (portfolioScore * 0.2);
      
      return {
        ...project,
        scores: {
          total: Math.round(totalScore * 100) / 100,
          skill: Math.round(skillScore * 100) / 100,
          rate: Math.round(rateScore * 100) / 100,
          portfolio: Math.round(portfolioScore * 100) / 100
        },
        matchReason: this.generateProjectMatchReason(skillScore, rateScore),
        totalScore
      };
    }).sort((a, b) => b.totalScore - a.totalScore);
  }

  async countQualifiedFreelancers(project) {
    const query = this.matchingEngine.buildCandidateQuery(project, false);
    return await User.countDocuments(query);
  }

  async analyzeSkillAvailability(skills) {
    const analysis = {};
    
    for (const skill of skills) {
      const count = await User.countDocuments({
        role: 'freelancer',
        skills: { $regex: new RegExp(skill, 'i') }
      });
      
      analysis[skill] = {
        availableFreelancers: count,
        scarcity: count < 10 ? 'high' : count < 50 ? 'medium' : 'low'
      };
    }
    
    return analysis;
  }

  async analyzeBudgetCompetitiveness(project) {
    if (project.budgetType !== 'hourly' || !project.budgetAmount) {
      return { competitive: 'unknown', reason: 'Fixed budget or no amount specified' };
    }

    // Get median rates for similar projects
    const similarProjects = await Project.find({
      category: project.category,
      budgetType: 'hourly',
      budgetAmount: { $exists: true }
    }).select('budgetAmount').lean();

    if (similarProjects.length === 0) {
      return { competitive: 'unknown', reason: 'Insufficient data' };
    }

    const rates = similarProjects.map(p => p.budgetAmount).sort((a, b) => a - b);
    const median = rates[Math.floor(rates.length / 2)];
    const percentile75 = rates[Math.floor(rates.length * 0.75)];
    
    let competitive = 'average';
    let reason = `Budget is around market median ($${median}/hr)`;
    
    if (project.budgetAmount >= percentile75) {
      competitive = 'high';
      reason = `Budget is above 75th percentile (${percentile75}/hr)`;
    } else if (project.budgetAmount < median * 0.8) {
      competitive = 'low';
      reason = `Budget is below market median ($${median}/hr)`;
    }

    return { competitive, reason, marketData: { median, percentile75 } };
  }

  generateImprovementRecommendations(project, analytics) {
    const recommendations = [];
    
    if (analytics.qualifiedFreelancers < 5) {
      recommendations.push({
        type: 'skills',
        message: 'Consider broadening skill requirements to attract more freelancers',
        priority: 'high'
      });
    }
    
    if (analytics.applications / Math.max(analytics.qualifiedFreelancers, 1) < 0.1) {
      recommendations.push({
        type: 'budget',
        message: 'Consider increasing budget to be more competitive',
        priority: 'medium'
      });
    }
    
    if (analytics.skillAnalysis) {
      const scarceSkills = Object.entries(analytics.skillAnalysis)
        .filter(([, data]) => data.scarcity === 'high')
        .map(([skill]) => skill);
      
      if (scarceSkills.length > 0) {
        recommendations.push({
          type: 'skills',
          message: `Skills in high demand: ${scarceSkills.join(', ')}. Consider offering premium rates.`,
          priority: 'medium'
        });
      }
    }
    
    return recommendations;
  }

  generateProjectMatchReason(skillScore, rateScore) {
    const reasons = [];
    
    if (skillScore > 0.8) reasons.push("Perfect skill match");
    else if (skillScore > 0.6) reasons.push("Good skill fit");
    
    if (rateScore > 0.8) reasons.push("Competitive rate");
    
    return reasons.length > 0 ? reasons.join(", ") : "Potential match";
  }

  trackMatchingAnalytics(projectId, matchResult) {
    // In production, send to analytics service (Google Analytics, Mixpanel, etc.)
    console.log(`Matching Analytics - Project: ${projectId}, Matches: ${matchResult.matches.length}`);
  }

  // Cache management
  clearCache() {
    this.cache.clear();
  }

  clearProjectCache(projectId) {
    const keysToDelete = [];
    for (const [key] of this.cache.entries()) {
      if (key.includes(`matches:${projectId}`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

module.exports = new MatchingService();