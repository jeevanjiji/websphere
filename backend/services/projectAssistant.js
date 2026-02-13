/**
 * WebSphere Project Assistant Service
 * 
 * AI-powered workspace assistant using a Groq-hosted Llama model.
 * Provides context-aware responses based on project data, milestones,
 * deliverables, payments, and chat history.
 */

const Groq = require('groq-sdk');
const Workspace = require('../models/Workspace');
const Milestone = require('../models/Milestone');
const Deliverable = require('../models/Deliverable');
const Escrow = require('../models/Escrow');
const Project = require('../models/Project');
const { Chat, Message } = require('../models/Chat');
const User = require('../models/User');
const { retrieveContext, formatSnippetsForPrompt } = require('./ragRetrieval');

// Initialize Groq client (guarded for missing key)
const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

/**
 * Format currency amount for display
 */
const formatCurrency = (amount, currency = 'INR') => {
  const symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
  return `${symbols[currency] || ''}${amount?.toLocaleString() || 0}`;
};

/**
 * Format date for display
 */
const formatDate = (date) => {
  if (!date) return 'Not set';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Get milestone status in human-readable format
 */
const getMilestoneStatusText = (milestone) => {
  const statusMap = {
    'pending': 'Not started',
    'in-progress': 'In progress',
    'review': 'Submitted, waiting for approval',
    'approved': 'Approved, pending payment',
    'rejected': 'Rejected, needs revision',
    'paid': 'Completed and paid',
    'payment-overdue': 'Payment overdue'
  };
  return statusMap[milestone.status] || milestone.status;
};

/**
 * Get deliverable status in human-readable format
 */
const getDeliverableStatusText = (deliverable) => {
  const statusMap = {
    'submitted': 'Submitted',
    'under-review': 'Under review',
    'revision-requested': 'Revision requested',
    'approved': 'Approved',
    'rejected': 'Rejected'
  };
  return statusMap[deliverable.status] || deliverable.status;
};

/**
 * Collect all workspace data needed for the AI context
 */
const collectWorkspaceData = async (workspaceId, userId, userRole) => {
  try {
    // Fetch workspace with populated references
    const workspace = await Workspace.findById(workspaceId)
      .populate('project', 'title description category deadline budgetAmount budgetType status skills')
      .populate('client', 'fullName email')
      .populate('freelancer', 'fullName email');

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    // Fetch milestones
    const milestones = await Milestone.find({ workspace: workspaceId })
      .sort({ order: 1 })
      .lean();

    // Fetch deliverables with submitter info
    const deliverables = await Deliverable.find({ workspace: workspaceId })
      .populate('submittedBy', 'fullName')
      .populate('milestone', 'title')
      .sort({ submissionDate: -1 })
      .lean();

    // Fetch escrows for payment information
    const escrows = await Escrow.find({ workspace: workspaceId })
      .populate('milestone', 'title')
      .lean();

    // Fetch recent chat messages (last 50)
    const chat = await Chat.findOne({
      project: workspace.project._id
    });

    let recentMessages = [];
    if (chat) {
      const messages = await Message.find({ chat: chat._id })
        .populate('sender', 'fullName')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
      recentMessages = messages.reverse(); // Chronological order
    }

    return {
      workspace,
      project: workspace.project,
      client: workspace.client,
      freelancer: workspace.freelancer,
      milestones,
      deliverables,
      escrows,
      recentMessages,
      userRole
    };
  } catch (error) {
    console.error('Error collecting workspace data:', error);
    throw error;
  }
};

/**
 * Build the context prompt for the AI based on workspace data
 * Applies role-based filtering for security
 */
const buildContextPrompt = (data, userQuestion) => {
  const { workspace, project, client, freelancer, milestones, deliverables, escrows, recentMessages, userRole } = data;

  // Build milestones section
  let milestonesSection = 'Milestones:\n';
  if (milestones.length === 0) {
    milestonesSection += '- No milestones created yet\n';
  } else {
    milestones.forEach((m, index) => {
      const isOverdue = m.dueDate && new Date(m.dueDate) < new Date() && !['paid', 'approved'].includes(m.status);
      milestonesSection += `- Milestone ${index + 1}: ${m.title} – ${formatCurrency(m.amount, m.currency)} – ${getMilestoneStatusText(m)}`;
      if (m.dueDate) {
        milestonesSection += ` (Due: ${formatDate(m.dueDate)})`;
      }
      if (isOverdue) {
        milestonesSection += ' ⚠️ OVERDUE';
      }
      milestonesSection += '\n';
    });
  }

  // Build deliverables section
  let deliverablesSection = 'Recent Deliverables:\n';
  if (deliverables.length === 0) {
    deliverablesSection += '- No deliverables submitted yet\n';
  } else {
    deliverables.slice(0, 10).forEach(d => {
      const milestoneInfo = d.milestone ? ` for "${d.milestone.title}"` : '';
      deliverablesSection += `- ${d.title}${milestoneInfo} – ${getDeliverableStatusText(d)} (uploaded by ${d.submittedBy?.fullName || 'Unknown'} at ${formatDate(d.submissionDate)})\n`;
    });
  }

  // Build payments section with role-based filtering
  let paymentsSection = 'Payment Status:\n';
  if (escrows.length === 0) {
    paymentsSection += '- No payments initiated yet\n';
  } else {
    escrows.forEach(e => {
      const milestoneName = e.milestone?.title || 'Unknown Milestone';
      
      if (userRole === 'client') {
        // Clients can see full payment details including escrow balances
        const statusText = e.status === 'released' ? 'Paid' : 
                          e.status === 'active' ? 'Locked in escrow' :
                          e.status === 'pending' ? 'Pending' :
                          e.status === 'disputed' ? 'Disputed' : e.status;
        paymentsSection += `- ${milestoneName}: ${formatCurrency(e.totalAmount)} – ${statusText}\n`;
      } else {
        // Freelancers can only see their earnings, not escrow details
        if (e.status === 'released') {
          paymentsSection += `- ${milestoneName}: ${formatCurrency(e.amountToFreelancer)} – Received\n`;
        } else if (e.status === 'active') {
          paymentsSection += `- ${milestoneName}: Payment secured by client\n`;
        } else {
          paymentsSection += `- ${milestoneName}: Awaiting client payment\n`;
        }
      }
    });
  }

  // Build recent chat section (limited context)
  let chatSection = 'Recent Conversation:\n';
  if (recentMessages.length === 0) {
    chatSection += '- No messages yet\n';
  } else {
    // Only include last 20 messages for context
    recentMessages.slice(-20).forEach(msg => {
      const senderName = msg.sender?.fullName || 'Unknown';
      const isClient = client._id.toString() === msg.sender?._id?.toString();
      const roleLabel = isClient ? 'Client' : 'Freelancer';
      // Truncate long messages
      const content = msg.content?.length > 200 ? msg.content.substring(0, 200) + '...' : msg.content;
      chatSection += `<${roleLabel} (${senderName})>: ${content}\n`;
    });
  }

  // Calculate project progress
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter(m => ['paid', 'approved'].includes(m.status)).length;
  const pendingMilestones = milestones.filter(m => ['pending', 'in-progress'].includes(m.status)).length;
  const inReviewMilestones = milestones.filter(m => m.status === 'review').length;
  const overdueMilestones = milestones.filter(m => 
    m.dueDate && new Date(m.dueDate) < new Date() && !['paid', 'approved'].includes(m.status)
  ).length;

  // Build the system prompt
  const systemPrompt = `You are WebSphere's AI Project Assistant - a helpful, professional assistant that helps clients and freelancers manage their projects effectively.

IMPORTANT RULES:
1. Only answer based on the provided workspace data - never make up information
2. Be concise and helpful
3. If asked about something not in the data, politely say you don't have that information
4. Never reveal sensitive payment details to freelancers (they can only see their earnings)
5. Maintain a professional, friendly tone
6. Use bullet points and clear formatting when listing multiple items
7. If there are urgent items (overdue deadlines, pending approvals), highlight them
8. You are speaking to a ${userRole}

CURRENT WORKSPACE CONTEXT:

Project: ${project.title}
Category: ${project.category || 'Not specified'}
Description: ${project.description?.substring(0, 300) || 'No description'}${project.description?.length > 300 ? '...' : ''}
Project Status: ${project.status || 'Unknown'}
Project Deadline: ${project.deadline ? formatDate(project.deadline) : 'Not set'}
${project.budgetAmount ? `Budget: ${formatCurrency(project.budgetAmount)}` : ''}

Client: ${client.fullName}
Freelancer: ${freelancer.fullName}

User Role: ${userRole}
User: ${userRole === 'client' ? client.fullName : freelancer.fullName}

Progress Summary:
- Total Milestones: ${totalMilestones}
- Completed: ${completedMilestones}
- In Review: ${inReviewMilestones}
- Pending/In Progress: ${pendingMilestones}
${overdueMilestones > 0 ? `- ⚠️ OVERDUE: ${overdueMilestones}` : ''}

${milestonesSection}
${deliverablesSection}
${paymentsSection}
${chatSection}`;

  return {
    systemPrompt,
    userQuestion
  };
};

/**
 * Generate AI response using Groq's llama-3.3-70b-versatile model
 */
const generateAIResponse = async (systemPrompt, userQuestion) => {
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userQuestion
        }
      ],
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false
    });

    return completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response. Please try again.';
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw new Error('Failed to generate AI response: ' + error.message);
  }
};

/**
 * Main function to handle AI assistant queries
 */
const askProjectAssistant = async (workspaceId, userId, userRole, question) => {
  try {
    // Validate inputs
    if (!workspaceId || !userId || !question) {
      throw new Error('Missing required parameters');
    }

    // Collect workspace data
    const workspaceData = await collectWorkspaceData(workspaceId, userId, userRole);

    // Build context prompt with role-based filtering
    const { systemPrompt, userQuestion } = buildContextPrompt(workspaceData, question);

    // --- RAG: retrieve relevant file snippets ---
    let ragContext = '';
    try {
      const snippets = await retrieveContext(workspaceId, question);
      ragContext = formatSnippetsForPrompt(snippets);
    } catch (ragErr) {
      console.warn('⚠️ RAG retrieval skipped:', ragErr.message);
    }

    // Generate AI response with RAG context injected
    const response = await generateAIResponse(systemPrompt + ragContext, userQuestion);

    return {
      success: true,
      reply: response,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in askProjectAssistant:', error);
    return {
      success: false,
      error: error.message,
      reply: 'I apologize, but I encountered an error while processing your request. Please try again later.'
    };
  }
};

/**
 * Generate a milestone summary
 */
const summarizeMilestone = async (workspaceId, milestoneId, userId, userRole) => {
  try {
    const milestone = await Milestone.findOne({ 
      _id: milestoneId, 
      workspace: workspaceId 
    }).lean();

    if (!milestone) {
      throw new Error('Milestone not found');
    }

    const deliverables = await Deliverable.find({ 
      milestone: milestoneId 
    })
    .populate('submittedBy', 'fullName')
    .lean();

    const escrow = await Escrow.findOne({ milestone: milestoneId }).lean();

    const question = `Please provide a comprehensive summary of "${milestone.title}" milestone, including:
1. Current status and progress
2. What deliverables have been submitted
3. Any pending actions needed
4. Payment status
5. Any concerns or items needing attention`;

    return await askProjectAssistant(workspaceId, userId, userRole, question);
  } catch (error) {
    console.error('Error in summarizeMilestone:', error);
    return {
      success: false,
      error: error.message,
      reply: 'Unable to generate milestone summary.'
    };
  }
};

/**
 * Generate next steps recommendation
 */
const getNextSteps = async (workspaceId, userId, userRole) => {
  const question = `Based on the current project status, what should I do next? Please provide clear, actionable steps prioritized by urgency.`;
  return await askProjectAssistant(workspaceId, userId, userRole, question);
};

/**
 * Generate project overview
 */
const getProjectOverview = async (workspaceId, userId, userRole) => {
  const question = `Please provide a comprehensive overview of this project, including:
1. Overall progress and health
2. Key milestones and their status
3. Recent activity
4. Any items needing immediate attention`;
  return await askProjectAssistant(workspaceId, userId, userRole, question);
};

module.exports = {
  askProjectAssistant,
  summarizeMilestone,
  getNextSteps,
  getProjectOverview
};
