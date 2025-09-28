const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const PaymentService = require('../services/paymentService');

// POST /api/payments/milestone/create - Create payment order for milestone
router.post('/milestone/create', auth(['client']), async (req, res) => {
  try {
    const { milestoneId } = req.body;
    
    console.log('🔥 CREATE MILESTONE PAYMENT - Request body:', req.body);
    console.log('🔥 CREATE MILESTONE PAYMENT - Milestone:', milestoneId, 'Client:', req.user.userId);
    console.log('🔥 CREATE MILESTONE PAYMENT - User object:', req.user);

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
    res.status(400).json({
      success: false,
      message: error.message
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

    const escrow = await PaymentService.createEscrow(milestoneId, req.user.userId);

    console.log('✅ Escrow created successfully');
    res.json({
      success: true,
      message: 'Escrow created successfully',
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

// POST /api/payments/escrow/release - Release escrow funds
router.post('/escrow/release', auth(['client', 'admin']), async (req, res) => {
  try {
    const { milestoneId } = req.body;
    
    console.log('🔥 RELEASE ESCROW - Milestone:', milestoneId);

    const result = await PaymentService.releaseEscrow(milestoneId);

    console.log('✅ Escrow released successfully');
    res.json({
      success: true,
      message: 'Escrow released successfully',
      data: result
    });
  } catch (error) {
    console.error('❌ Error releasing escrow:', error);
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