const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const PaymentService = require('../services/paymentService');
const EscrowService = require('../services/escrowService');

// POST /api/payments/milestone/create - Create payment order for milestone
router.post('/milestone/create', auth(['client']), async (req, res) => {
  try {
    const { milestoneId } = req.body;
    
    console.log('🔥 CREATE MILESTONE PAYMENT - Request body:', req.body);
    console.log('🔥 CREATE MILESTONE PAYMENT - Milestone:', milestoneId, 'Client:', req.user.userId);
    console.log('🔥 CREATE MILESTONE PAYMENT - User object:', req.user);

    // Validate request data
    if (!milestoneId) {
      console.log('❌ CREATE MILESTONE PAYMENT - Missing milestoneId');
      return res.status(400).json({
        success: false,
        message: 'Milestone ID is required'
      });
    }

    if (!req.user.userId) {
      console.log('❌ CREATE MILESTONE PAYMENT - Missing userId in token');
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      });
    }

    const paymentOrder = await PaymentService.createMilestonePayment(milestoneId, req.user.userId);

    console.log('✅ Payment order created successfully');
    res.json({
      success: true,
      message: 'Payment order created successfully',
      data: paymentOrder
    });
  } catch (error) {
    console.error('❌ Error creating payment order:', error);
    console.error('❌ Error stack:', error.stack);
    
    // More detailed error responses
    let statusCode = 400;
    let errorMessage = error.message || 'An error occurred';
    
    if (errorMessage.includes('not found')) {
      statusCode = 404;
    } else if (errorMessage.includes('Unauthorized')) {
      statusCode = 403;
    } else if (errorMessage.includes('must be approved')) {
      statusCode = 422;
      errorMessage = `Payment cannot be initiated: ${errorMessage}. Current milestone status and payment due date may not meet requirements.`;
    } else if (errorMessage.includes('already paid')) {
      statusCode = 409;
      errorMessage = 'This milestone has already been paid.';
    } else if (error.statusCode) {
      // Handle Razorpay API errors
      statusCode = error.statusCode;
      if (error.error && error.error.description) {
        errorMessage = `Payment service error: ${error.error.description}`;
      }
    }
    
    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// POST /api/payments/milestone/verify - Verify and complete payment
router.post('/milestone/verify', auth(['client']), async (req, res) => {
  try {
    const paymentData = req.body;
    
    console.log('🔥 VERIFY MILESTONE PAYMENT - Payment ID:', paymentData.razorpay_payment_id);

    const result = await PaymentService.verifyAndCompletePayment(paymentData);

    console.log('✅ Payment verified and completed successfully');
    res.json({
      success: true,
      message: 'Payment completed successfully',
      data: result
    });
  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/payments/milestone/failure - Handle payment failure
router.post('/milestone/failure', auth(['client']), async (req, res) => {
  try {
    const { orderId, reason, errorCode } = req.body;
    
    console.log('🔥 PAYMENT FAILURE - Order:', orderId, 'Reason:', reason, 'Error Code:', errorCode);

    await PaymentService.handlePaymentFailure(orderId, reason, errorCode);

    res.json({
      success: true,
      message: 'Payment failure handled'
    });
  } catch (error) {
    console.error('❌ Error handling payment failure:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to handle payment failure'
    });
  }
});

// GET /api/payments/workspace/:workspaceId/history - Get payment history
router.get('/workspace/:workspaceId/history', auth(['client', 'freelancer']), async (req, res) => {
  try {
    const { workspaceId } = req.params;
    
    console.log('🔥 GET PAYMENT HISTORY - Workspace:', workspaceId);

    const paymentHistory = await PaymentService.getPaymentHistory(workspaceId);

    console.log('✅ Payment history retrieved successfully');
    res.json({
      success: true,
      data: paymentHistory
    });
  } catch (error) {
    console.error('❌ Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history'
    });
  }
});

// POST /api/payments/escrow/create - Create escrow for milestone
router.post('/escrow/create', auth(['client']), async (req, res) => {
  try {
    const { milestoneId } = req.body;
    
    console.log('🔥 CREATE ESCROW - Milestone:', milestoneId);

    const escrow = await EscrowService.createEscrowPayment(milestoneId, req.user.userId);

    console.log('✅ Escrow created successfully');
    res.json({
      success: true,
      message: 'Escrow payment order created successfully',
      data: escrow
    });
  } catch (error) {
    console.error('❌ Error creating escrow:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/payments/escrow/verify - Verify escrow payment
router.post('/escrow/verify', auth(['client']), async (req, res) => {
  try {
    const paymentData = req.body;
    
    console.log('🔥 VERIFY ESCROW PAYMENT - Payment ID:', paymentData.razorpay_payment_id);

    const result = await EscrowService.verifyAndActivateEscrow(paymentData);

    console.log('✅ Escrow payment verified and activated');
    res.json({
      success: true,
      message: 'Escrow payment verified and funds secured',
      data: result
    });
  } catch (error) {
    console.error('❌ Error verifying escrow payment:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/payments/escrow/submit-deliverable - Submit deliverable
router.post('/escrow/submit-deliverable', auth(['freelancer']), async (req, res) => {
  try {
    const { milestoneId, notes, attachments } = req.body;
    
    console.log('🔥 SUBMIT DELIVERABLE - Milestone:', milestoneId);

    const result = await EscrowService.submitDeliverable(milestoneId, req.user.userId, {
      notes,
      attachments
    });

    console.log('✅ Deliverable submitted successfully');
    res.json({
      success: true,
      message: 'Deliverable submitted for client review',
      data: result
    });
  } catch (error) {
    console.error('❌ Error submitting deliverable:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/payments/escrow/approve-deliverable - Approve/reject deliverable
router.post('/escrow/approve-deliverable', auth(['client']), async (req, res) => {
  try {
    const { milestoneId, approved, notes } = req.body;
    
    console.log('🔥 APPROVE DELIVERABLE - Milestone:', milestoneId, 'Approved:', approved);

    const result = await EscrowService.approveDeliverable(milestoneId, req.user.userId, {
      approved,
      notes
    });

    console.log('✅ Deliverable approval processed');
    res.json({
      success: true,
      message: approved ? 'Deliverable approved' : 'Deliverable rejected',
      data: result
    });
  } catch (error) {
    console.error('❌ Error processing deliverable approval:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/payments/escrow/release - Release escrow funds (Admin only)
router.post('/escrow/release', auth(['admin']), async (req, res) => {
  try {
    const { milestoneId, releaseReason } = req.body;
    
    console.log('🔥 RELEASE ESCROW - Milestone:', milestoneId);

    const result = await EscrowService.releaseFunds(milestoneId, req.user.userId, releaseReason);

    console.log('✅ Escrow funds released successfully');
    res.json({
      success: true,
      message: 'Funds released to freelancer successfully',
      data: result
    });
  } catch (error) {
    console.error('❌ Error releasing escrow funds:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/payments/escrow/raise-dispute - Raise dispute
router.post('/escrow/raise-dispute', auth(['client', 'freelancer']), async (req, res) => {
  try {
    const { milestoneId, disputeReason } = req.body;
    
    console.log('🔥 RAISE DISPUTE - Milestone:', milestoneId);

    const result = await EscrowService.raiseDispute(milestoneId, req.user.userId, disputeReason);

    console.log('⚠️ Dispute raised successfully');
    res.json({
      success: true,
      message: 'Dispute raised successfully. Admin will review.',
      data: result
    });
  } catch (error) {
    console.error('❌ Error raising dispute:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/payments/escrow/resolve-dispute - Resolve dispute (Admin only)
router.post('/escrow/resolve-dispute', auth(['admin']), async (req, res) => {
  try {
    const { milestoneId, resolution, refundToClient, releaseToFreelancer, notes } = req.body;
    
    console.log('🔥 RESOLVE DISPUTE - Milestone:', milestoneId);

    const result = await EscrowService.resolveDispute(milestoneId, req.user.userId, {
      resolution,
      refundToClient,
      releaseToFreelancer,
      notes
    });

    console.log('✅ Dispute resolved successfully');
    res.json({
      success: true,
      message: 'Dispute resolved successfully',
      data: result
    });
  } catch (error) {
    console.error('❌ Error resolving dispute:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/payments/escrow/:milestoneId - Get escrow details
router.get('/escrow/:milestoneId', auth(['client', 'freelancer', 'admin']), async (req, res) => {
  try {
    const { milestoneId } = req.params;
    
    console.log('🔥 GET ESCROW DETAILS - Milestone:', milestoneId);

    const escrow = await EscrowService.getEscrowDetails(milestoneId);

    if (!escrow) {
      return res.status(404).json({
        success: false,
        message: 'Escrow not found'
      });
    }

    // Check authorization
    const isAuthorized = req.user.role === 'admin' || 
                        escrow.client.toString() === req.user.userId || 
                        escrow.freelancer.toString() === req.user.userId;

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    console.log('✅ Escrow details retrieved');
    res.json({
      success: true,
      data: escrow
    });
  } catch (error) {
    console.error('❌ Error getting escrow details:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/payments/escrow/workspace/:workspaceId/history - Get escrow history
router.get('/escrow/workspace/:workspaceId/history', auth(['client', 'freelancer', 'admin']), async (req, res) => {
  try {
    const { workspaceId } = req.params;
    
    console.log('🔥 GET ESCROW HISTORY - Workspace:', workspaceId);

    const escrows = await EscrowService.getEscrowHistory(workspaceId);

    console.log('✅ Escrow history retrieved');
    res.json({
      success: true,
      data: escrows
    });
  } catch (error) {
    console.error('❌ Error getting escrow history:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Webhook endpoint for Razorpay (optional - for automated updates)
router.post('/webhook/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body;

    // Verify webhook signature (implement based on Razorpay docs)
    // This is a simplified version
    
    const event = JSON.parse(body);
    
    console.log('🔥 RAZORPAY WEBHOOK - Event:', event.event);

    switch (event.event) {
      case 'payment.captured':
        // Handle successful payment
        console.log('✅ Payment captured:', event.payload.payment.entity.id);
        break;
      case 'payment.failed':
        // Handle failed payment
        console.log('❌ Payment failed:', event.payload.payment.entity.id);
        break;
      default:
        console.log('ℹ️ Unhandled webhook event:', event.event);
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
});

module.exports = router;