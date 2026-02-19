/**
 * WebSphere AI Assistant Routes
 *
 * API endpoints for the workspace-aware AI project assistant.
 * Uses Groq-hosted Llama with RAG retrieval over workspace files.
 */

const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const Workspace = require('../models/Workspace');
const {
  askProjectAssistant,
  summarizeMilestone,
  getNextSteps,
  getProjectOverview
} = require('../services/projectAssistant');

/**
 * Middleware to check workspace access and determine user role
 */
const checkWorkspaceAccess = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.userId;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    const isClient = workspace.client.toString() === userId;
    const isFreelancer = workspace.freelancer.toString() === userId;

    if (!isClient && !isFreelancer) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not authorized to access this workspace.'
      });
    }

    req.workspace = workspace;
    req.userRole = isClient ? 'client' : 'freelancer';
    next();
  } catch (error) {
    console.error('❌ Error checking workspace access:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * POST /api/workspace/:workspaceId/ask-ai
 * Main endpoint to ask the AI assistant a question
 */
router.post(
  '/:workspaceId/ask-ai',
  auth(['client', 'freelancer']),
  checkWorkspaceAccess,
  async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const { message } = req.body;
      const userId = req.user.userId;
      const userRole = req.userRole;

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid question'
        });
      }

      if (message.length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Question is too long. Please keep it under 1000 characters.'
        });
      }

      console.log(`🤖 AI Assistant query from ${userRole} in workspace ${workspaceId}: "${message.substring(0, 50)}..."`);

      const result = await askProjectAssistant(workspaceId, userId, userRole, message);

      if (result.success) {
        res.json({
          success: true,
          reply: result.reply,
          timestamp: result.timestamp
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.error || 'Failed to generate response',
          reply: result.reply
        });
      }
    } catch (error) {
      console.error('❌ Error in ask-ai endpoint:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
);

/**
 * POST /api/workspace/:workspaceId/ask-ai/summarize-milestone/:milestoneId
 */
router.post(
  '/:workspaceId/ask-ai/summarize-milestone/:milestoneId',
  auth(['client', 'freelancer']),
  checkWorkspaceAccess,
  async (req, res) => {
    try {
      const { workspaceId, milestoneId } = req.params;
      const userId = req.user.userId;
      const userRole = req.userRole;

      const result = await summarizeMilestone(workspaceId, milestoneId, userId, userRole);

      if (result.success) {
        res.json({ success: true, reply: result.reply, timestamp: result.timestamp });
      } else {
        res.status(500).json({ success: false, message: result.error, reply: result.reply });
      }
    } catch (error) {
      console.error('❌ Error in summarize-milestone endpoint:', error);
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  }
);

/**
 * POST /api/workspace/:workspaceId/ask-ai/next-steps
 */
router.post(
  '/:workspaceId/ask-ai/next-steps',
  auth(['client', 'freelancer']),
  checkWorkspaceAccess,
  async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const userId = req.user.userId;
      const userRole = req.userRole;

      const result = await getNextSteps(workspaceId, userId, userRole);

      if (result.success) {
        res.json({ success: true, reply: result.reply, timestamp: result.timestamp });
      } else {
        res.status(500).json({ success: false, message: result.error, reply: result.reply });
      }
    } catch (error) {
      console.error('❌ Error in next-steps endpoint:', error);
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  }
);

/**
 * POST /api/workspace/:workspaceId/ask-ai/overview
 */
router.post(
  '/:workspaceId/ask-ai/overview',
  auth(['client', 'freelancer']),
  checkWorkspaceAccess,
  async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const userId = req.user.userId;
      const userRole = req.userRole;

      const result = await getProjectOverview(workspaceId, userId, userRole);

      if (result.success) {
        res.json({ success: true, reply: result.reply, timestamp: result.timestamp });
      } else {
        res.status(500).json({ success: false, message: result.error, reply: result.reply });
      }
    } catch (error) {
      console.error('❌ Error in overview endpoint:', error);
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  }
);

module.exports = router;
