// backend/services/matchingEngine.js
const User = require('../models/User');
const Project = require('../models/Project');
const Application = require('../models/Application');

/**
 * Neural Retriever & Similarity Pipeline for Freelancer-Project Matching
 * Simplified implementation inspired by production-scale matching systems
 */
class MatchingEngine {
  constructor() {
    // Skill categories with weights for semantic matching
    this.skillCategories = {
      'frontend': {
        skills: ['react', 'vue', 'angular', 'javascript', 'typescript', 'html', 'css', 'sass', 'webpack', 'vite'],
        weight: 1.0
      },
      'backend': {
        skills: ['node.js', 'express', 'python', 'django', 'flask', 'java', 'spring', 'php', 'laravel', 'ruby'],
        weight: 1.0
      },
      'mobile': {
        skills: ['react-native', 'flutter', 'swift', 'kotlin', 'ios', 'android', 'xamarin', 'ionic'],
        weight: 1.0
      },
      'database': {
        skills: ['mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'firebase'],
        weight: 0.8
      },
      'design': {
        skills: ['ui/ux', 'figma', 'photoshop', 'illustrator', 'sketch', 'adobe-xd', 'canva'],
        weight: 0.9
      },
      'devops': {
        skills: ['docker', 'kubernetes', 'aws', 'azure', 'gcp', 'jenkins', 'gitlab-ci'],
        weight: 0.7
      }
    };

    // Experience level multipliers
    this.experienceMultipliers = {
      'beginner': 0.8,
      'intermediate': 1.0,
      'expert': 1.2
    };

    // Rate compatibility scoring
    this.rateTolerancePercent = 20; // 20% tolerance for rate matching
  }

  /**
   * Main matching function - Neural Retriever Pipeline
   * @param {ObjectId} projectId - Project to match freelancers for
   * @param {Object} options - Matching options
   * @returns {Array} Ranked list of matching freelancers with scores
   */
  async matchFreelancersToProject(projectId, options = {}) {
    const { 
      limit = 20, 
      minScore = 0.3, 
      includeApplied = false,
      diversityBoost = true 
    } = options;

    try {
      // Step 1: Retrieve project and validate
      const project = await Project.findById(projectId).lean();
      if (!project) {
        throw new Error('Project not found');
      }

      // Step 2: Get candidate freelancers (pre-filtering)
      const candidateQuery = this.buildCandidateQuery(project, includeApplied);
      const candidates = await User.find(candidateQuery).lean();

      if (candidates.length === 0) {
        return { matches: [], totalCandidates: 0, searchMeta: this.getSearchMeta(project) };
      }

      // Step 3: Apply Neural Retriever (semantic similarity)
      const scoredCandidates = await this.scoreFreelancers(candidates, project);

      // Step 4: Apply ranking and diversity
      let rankedCandidates = scoredCandidates
        .filter(candidate => candidate.totalScore >= minScore)
        .sort((a, b) => b.totalScore - a.totalScore);

      // Step 5: Diversity boost (avoid clustering similar profiles)
      if (diversityBoost) {
        rankedCandidates = this.applyDiversityBoost(rankedCandidates);
      }

      return {
        matches: rankedCandidates.slice(0, limit),
        totalCandidates: candidates.length,
        searchMeta: this.getSearchMeta(project),
        matchingStrategy: 'neural_retriever_v1'
      };

    } catch (error) {
      console.error('Matching Engine Error:', error);
      throw error;
    }
  }

  /**
   * Build MongoDB query for candidate retrieval
   */
  buildCandidateQuery(project, includeApplied = false) {
    const query = {
      role: 'freelancer',
      profileComplete: true,
      'profile.isAvailable': { $ne: false }
    };

    // Exclude freelancers who already applied (unless specified)
    if (!includeApplied) {
      // This would need to be populated separately due to MongoDB limitations
      // For now, we'll handle this in post-processing
    }

    // Skill pre-filtering (broad match)
    if (project.skills && project.skills.length > 0) {
      const skillRegexes = project.skills.map(skill => new RegExp(skill, 'i'));
      query.skills = { $in: skillRegexes };
    }

    // Rate range pre-filtering
    if (project.budgetType === 'hourly' && project.budgetAmount) {
      const maxAcceptableRate = project.budgetAmount * 1.3; // 30% tolerance
      query.hourlyRate = { $lte: maxAcceptableRate };
    }

    return query;
  }

  /**
   * Core scoring algorithm - Similarity Pipeline
   */
  async scoreFreelancers(candidates, project) {
    const projectVector = this.createProjectVector(project);
    
    return candidates.map(freelancer => {
      const freelancerVector = this.createFreelancerVector(freelancer);
      
      // Calculate individual scores
      const skillScore = this.calculateSkillSimilarity(projectVector.skills, freelancerVector.skills);
      const experienceScore = this.calculateExperienceScore(freelancer.experienceLevel, project.category);
      const rateScore = this.calculateRateCompatibility(freelancer.hourlyRate, project);
      const portfolioScore = this.calculatePortfolioRelevance(freelancer.portfolio, project);
      const availabilityScore = this.calculateAvailabilityScore(freelancer);
      
      // Weighted combination (neural-inspired)
      const weights = {
        skills: 0.35,
        experience: 0.20,
        rate: 0.15,
        portfolio: 0.20,
        availability: 0.10
      };
      
      const totalScore = (
        skillScore * weights.skills +
        experienceScore * weights.experience +
        rateScore * weights.rate +
        portfolioScore * weights.portfolio +
        availabilityScore * weights.availability
      );

      return {
        freelancer: {
          _id: freelancer._id,
          fullName: freelancer.fullName,
          email: freelancer.email,
          profilePicture: freelancer.profilePicture,
          bio: freelancer.bio,
          skills: freelancer.skills,
          hourlyRate: freelancer.hourlyRate,
          experienceLevel: freelancer.experienceLevel,
          rating: freelancer.rating || { average: 0, count: 0 }
        },
        scores: {
          total: Math.round(totalScore * 100) / 100,
          skill: Math.round(skillScore * 100) / 100,
          experience: Math.round(experienceScore * 100) / 100,
          rate: Math.round(rateScore * 100) / 100,
          portfolio: Math.round(portfolioScore * 100) / 100,
          availability: Math.round(availabilityScore * 100) / 100
        },
        totalScore,
        matchReason: this.generateMatchReason(skillScore, experienceScore, portfolioScore)
      };
    });
  }

  /**
   * Create semantic vector representation of project
   */
  createProjectVector(project) {
    return {
      skills: this.normalizeSkills(project.skills || []),
      category: project.category,
      budgetRange: this.normalizeBudget(project),
      urgency: this.calculateUrgency(project.deadline),
      complexity: this.estimateComplexity(project)
    };
  }

  /**
   * Create semantic vector representation of freelancer
   */
  createFreelancerVector(freelancer) {
    return {
      skills: this.normalizeSkills(freelancer.skills || []),
      experienceLevel: freelancer.experienceLevel,
      rateRange: freelancer.hourlyRate,
      portfolioCategories: this.extractPortfolioCategories(freelancer.portfolio || []),
      availability: freelancer.profile?.availability || 'available'
    };
  }

  /**
   * Skill similarity using semantic matching
   */
  calculateSkillSimilarity(projectSkills, freelancerSkills) {
    if (projectSkills.length === 0 || freelancerSkills.length === 0) {
      return 0.5; // Neutral score
    }

    let totalScore = 0;
    let matchedSkills = 0;

    projectSkills.forEach(projectSkill => {
      let bestMatch = 0;
      
      freelancerSkills.forEach(freelancerSkill => {
        const similarity = this.semanticSkillSimilarity(projectSkill, freelancerSkill);
        bestMatch = Math.max(bestMatch, similarity);
      });
      
      if (bestMatch > 0.3) { // Threshold for considering a match
        totalScore += bestMatch;
        matchedSkills++;
      }
    });

    // Boost for coverage (how many project skills are covered)
    const coverageBonus = matchedSkills / projectSkills.length;
    const averageScore = matchedSkills > 0 ? totalScore / matchedSkills : 0;
    
    return Math.min(1.0, averageScore * 0.7 + coverageBonus * 0.3);
  }

  /**
   * Semantic similarity between individual skills
   */
  semanticSkillSimilarity(skill1, skill2) {
    skill1 = skill1.toLowerCase().trim();
    skill2 = skill2.toLowerCase().trim();

    // Exact match
    if (skill1 === skill2) return 1.0;

    // Check skill categories for semantic similarity
    for (const category of Object.values(this.skillCategories)) {
      const inCategory1 = category.skills.some(s => skill1.includes(s) || s.includes(skill1));
      const inCategory2 = category.skills.some(s => skill2.includes(s) || s.includes(skill2));
      
      if (inCategory1 && inCategory2) {
        return 0.8 * category.weight;
      }
    }

    // Substring matching for related technologies
    if (skill1.includes(skill2) || skill2.includes(skill1)) {
      return 0.6;
    }

    // Common technology patterns
    const patterns = [
      ['react', 'reactjs', 'react.js'],
      ['vue', 'vuejs', 'vue.js'],
      ['node', 'nodejs', 'node.js'],
      ['javascript', 'js', 'ecmascript'],
      ['typescript', 'ts'],
      ['python', 'py'],
      ['mongodb', 'mongo'],
      ['postgresql', 'postgres', 'psql']
    ];

    for (const pattern of patterns) {
      if (pattern.includes(skill1) && pattern.includes(skill2)) {
        return 0.9;
      }
    }

    return 0.0;
  }

  /**
   * Calculate experience score based on project requirements
   */
  calculateExperienceScore(freelancerLevel, projectCategory) {
    if (!freelancerLevel) return 0.5;

    const multiplier = this.experienceMultipliers[freelancerLevel] || 1.0;
    
    // Boost for certain categories requiring specific experience
    const categoryBoosts = {
      'full-stack-development': freelancerLevel === 'expert' ? 1.2 : 1.0,
      'data-science': freelancerLevel !== 'beginner' ? 1.1 : 0.8,
      'ui-ux-design': 1.0, // Experience level less critical
      'content-writing': 1.0
    };

    const categoryBoost = categoryBoosts[projectCategory] || 1.0;
    
    return Math.min(1.0, multiplier * categoryBoost);
  }

  /**
   * Rate compatibility scoring
   */
  calculateRateCompatibility(freelancerRate, project) {
    if (!freelancerRate || !project.budgetAmount) {
      return 0.7; // Neutral score when rate info is missing
    }

    if (project.budgetType === 'fixed') {
      // Estimate hours for fixed projects (rough heuristic)
      const estimatedHours = this.estimateProjectHours(project);
      const impliedHourlyRate = project.budgetAmount / estimatedHours;
      
      const rateDifference = Math.abs(freelancerRate - impliedHourlyRate) / impliedHourlyRate;
      
      if (rateDifference <= 0.2) return 1.0; // Within 20%
      if (rateDifference <= 0.4) return 0.8; // Within 40%
      if (rateDifference <= 0.6) return 0.6; // Within 60%
      return 0.3;
    } else {
      // Hourly projects
      const rateDifference = Math.abs(freelancerRate - project.budgetAmount) / project.budgetAmount;
      
      if (rateDifference <= 0.15) return 1.0;
      if (rateDifference <= 0.3) return 0.8;
      if (rateDifference <= 0.5) return 0.6;
      return 0.3;
    }
  }

  /**
   * Portfolio relevance scoring
   */
  calculatePortfolioRelevance(portfolio, project) {
    if (!portfolio || portfolio.length === 0) {
      return 0.4; // Slight penalty for no portfolio
    }

    let maxRelevance = 0;
    
    portfolio.forEach(item => {
      let relevance = 0;
      
      // Check title and description for project keywords
      const text = `${item.title} ${item.description}`.toLowerCase();
      const projectText = `${project.title} ${project.description}`.toLowerCase();
      
      // Simple keyword matching (can be enhanced with NLP)
      const projectKeywords = this.extractKeywords(projectText);
      const portfolioKeywords = this.extractKeywords(text);
      
      const commonKeywords = projectKeywords.filter(kw => 
        portfolioKeywords.some(pkw => pkw.includes(kw) || kw.includes(pkw))
      );
      
      if (commonKeywords.length > 0) {
        relevance = Math.min(1.0, commonKeywords.length / projectKeywords.length);
      }
      
      // Technology stack matching
      if (item.technologies) {
        const techMatch = this.calculateSkillSimilarity(project.skills || [], item.technologies);
        relevance = Math.max(relevance, techMatch);
      }
      
      maxRelevance = Math.max(maxRelevance, relevance);
    });

    return maxRelevance;
  }

  /**
   * Availability scoring
   */
  calculateAvailabilityScore(freelancer) {
    // This would integrate with calendar/availability systems in production
    const availability = freelancer.profile?.availability || 'available';
    
    const scores = {
      'available': 1.0,
      'partially-available': 0.7,
      'busy': 0.3,
      'unavailable': 0.0
    };
    
    return scores[availability] || 0.8;
  }

  /**
   * Apply diversity boost to prevent clustering
   */
  applyDiversityBoost(rankedCandidates) {
    const boosted = [...rankedCandidates];
    const seen = new Set();
    
    return boosted.map((candidate, index) => {
      // Create diversity signature
      const signature = this.createDiversitySignature(candidate.freelancer);
      
      if (seen.has(signature) && index > 0) {
        // Apply diversity penalty
        candidate.totalScore *= 0.95;
        candidate.scores.total = Math.round(candidate.totalScore * 100) / 100;
      }
      
      seen.add(signature);
      return candidate;
    }).sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Generate match explanation
   */
  generateMatchReason(skillScore, experienceScore, portfolioScore) {
    const reasons = [];
    
    if (skillScore > 0.8) reasons.push("Excellent skill match");
    else if (skillScore > 0.6) reasons.push("Good skill alignment");
    
    if (experienceScore > 0.8) reasons.push("Strong experience level");
    
    if (portfolioScore > 0.7) reasons.push("Relevant portfolio work");
    
    return reasons.length > 0 ? reasons.join(", ") : "General match";
  }

  // Helper methods
  normalizeSkills(skills) {
    return skills.map(skill => skill.toLowerCase().trim()).filter(Boolean);
  }

  normalizeBudget(project) {
    return {
      type: project.budgetType,
      amount: project.budgetAmount,
      min: project.budgetMin,
      max: project.budgetMax
    };
  }

  calculateUrgency(deadline) {
    if (!deadline) return 0.5;
    
    const now = new Date();
    const daysUntilDeadline = (new Date(deadline) - now) / (1000 * 60 * 60 * 24);
    
    if (daysUntilDeadline <= 7) return 1.0;     // Very urgent
    if (daysUntilDeadline <= 30) return 0.7;    // Moderately urgent
    if (daysUntilDeadline <= 90) return 0.5;    // Normal
    return 0.3;                                  // Not urgent
  }

  estimateComplexity(project) {
    let complexity = 0.5;
    
    // Based on description length
    if (project.description.length > 1000) complexity += 0.2;
    
    // Based on skill count
    if (project.skills && project.skills.length > 5) complexity += 0.2;
    
    // Based on budget (higher budget = more complex)
    if (project.budgetAmount > 5000) complexity += 0.2;
    
    return Math.min(1.0, complexity);
  }

  extractPortfolioCategories(portfolio) {
    return portfolio.map(item => item.category || 'general').filter(Boolean);
  }

  extractKeywords(text) {
    // Simple keyword extraction - can be enhanced with NLP libraries
    return text.split(/\W+/)
      .filter(word => word.length > 3)
      .map(word => word.toLowerCase())
      .slice(0, 10); // Limit keywords
  }

  estimateProjectHours(project) {
    // Rough estimation heuristic - should be improved with ML
    const baseHours = {
      'ui-ux-design': 40,
      'frontend-development': 80,
      'backend-development': 120,
      'full-stack-development': 200,
      'mobile-app-development': 160,
      'data-science': 100
    };
    
    const base = baseHours[project.category] || 80;
    const complexityMultiplier = this.estimateComplexity(project) + 0.5;
    
    return Math.round(base * complexityMultiplier);
  }

  createDiversitySignature(freelancer) {
    // Create signature to avoid similar freelancers dominating results
    const primarySkill = freelancer.skills[0] || 'general';
    const rateRange = freelancer.hourlyRate ? Math.floor(freelancer.hourlyRate / 20) * 20 : 0;
    return `${primarySkill}-${freelancer.experienceLevel}-${rateRange}`;
  }

  getSearchMeta(project) {
    return {
      projectId: project._id,
      category: project.category,
      skillsRequired: project.skills?.length || 0,
      budgetType: project.budgetType,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new MatchingEngine();