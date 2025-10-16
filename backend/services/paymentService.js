// backend/services/paymentService.js
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Milestone = require('../models/Milestone');
const User = require('../models/User');
const Escrow = require('../models/Escrow');
const EscrowService = require('./escrowService');
const { sendEmail } = require('../utils/brevoEmailService');

// Initialize Razorpay (You'll need to add these to your environment variables)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'your_razorpay_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_razorpay_key_secret'
});

class PaymentService {
  // Create a payment order for milestone (Legacy method - redirects to escrow)
  static async createMilestonePayment(milestoneId, clientId) {
    try {
      console.log('� PaymentService: Redirecting to EscrowService for milestone payment');
      
      // For new payments, use escrow system
      const result = await EscrowService.createEscrowPayment(milestoneId, clientId);
      
      return result;
    } catch (error) {
      console.error('❌ Error in createMilestonePayment:', error);
      throw error;
    }
  }

  // Create escrow payment order (New method)
  static async createEscrowPayment(milestoneId, clientId) {
    return await EscrowService.createEscrowPayment(milestoneId, clientId);
  }

  // Verify payment signature and complete payment (Legacy - redirects to escrow)
  static async verifyAndCompletePayment(paymentData) {
    try {
      console.log('🔄 PaymentService: Redirecting to EscrowService for payment verification');
      
      // Check if this is an escrow payment
      const { milestone_id } = paymentData;
      const escrow = await Escrow.findOne({ milestone: milestone_id });
      
      if (escrow) {
        // Use escrow verification
        return await EscrowService.verifyAndActivateEscrow(paymentData);
      } else {
        // Legacy direct payment (for backwards compatibility)
        return await this.legacyVerifyAndCompletePayment(paymentData);
      }
    } catch (error) {
      console.error('❌ Error in verifyAndCompletePayment:', error);
      throw error;
    }
  }

  // Legacy payment verification (for backwards compatibility)
  static async legacyVerifyAndCompletePayment(paymentData) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, milestone_id } = paymentData;

      // Verify signature
      const sign = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSign = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'your_razorpay_key_secret')
        .update(sign.toString())
        .digest("hex");

      if (razorpay_signature !== expectedSign) {
        throw new Error('Invalid payment signature');
      }

      // Get payment details from Razorpay
      const payment = await razorpay.payments.fetch(razorpay_payment_id);

      if (payment.status !== 'captured') {
        throw new Error('Payment not captured');
      }

      // Update milestone
      const milestone = await Milestone.findById(milestone_id)
        .populate('workspace')
        .populate({
          path: 'workspace',
          populate: {
            path: 'client freelancer',
            select: 'fullName email totalEarnings'
          }
        });

      if (!milestone) {
        throw new Error('Milestone not found');
      }

      milestone.paymentStatus = 'completed';
      milestone.status = 'paid';
      milestone.paidDate = new Date();
      milestone.paymentDetails = {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        amount: payment.amount / 100, // Convert back from paise
        currency: payment.currency,
        method: payment.method,
        paidAt: new Date(payment.created_at * 1000)
      };

      await milestone.save();

      // Update freelancer earnings
      const freelancer = milestone.workspace.freelancer;
      freelancer.totalEarnings = (freelancer.totalEarnings || 0) + milestone.amount;
      freelancer.completedProjects = (freelancer.completedProjects || 0) + 1;
      await freelancer.save();

      // Send payment confirmation emails
      await this.sendPaymentNotifications(milestone);

      return {
        success: true,
        milestone,
        payment: {
          id: razorpay_payment_id,
          amount: milestone.amount,
          currency: milestone.currency,
          status: 'completed'
        }
      };
    } catch (error) {
      console.error('❌ Error verifying legacy payment:', error);
      throw error;
    }
  }

  // Verify escrow payment
  static async verifyEscrowPayment(paymentData) {
    return await EscrowService.verifyAndActivateEscrow(paymentData);
  }

  // Send payment notifications
  static async sendPaymentNotifications(milestone) {
    try {
      const client = milestone.workspace.client;
      const freelancer = milestone.workspace.freelancer;

      // Email to client
      await sendEmail({
        to: client.email,
        subject: 'Payment Confirmation - Milestone Completed',
        template: 'payment-confirmation-client',
        variables: {
          clientName: client.fullName,
          freelancerName: freelancer.fullName,
          milestoneTitle: milestone.title,
          amount: milestone.amount,
          currency: milestone.currency,
          paymentDate: milestone.paidDate.toLocaleDateString(),
          projectTitle: milestone.workspace.project?.title || 'Project'
        }
      });

      // Email to freelancer
      await sendEmail({
        to: freelancer.email,
        subject: 'Payment Received - Milestone Completed',
        template: 'payment-confirmation-freelancer',
        variables: {
          freelancerName: freelancer.fullName,
          clientName: client.fullName,
          milestoneTitle: milestone.title,
          amount: milestone.amount,
          currency: milestone.currency,
          paymentDate: milestone.paidDate.toLocaleDateString(),
          newTotalEarnings: freelancer.totalEarnings
        }
      });
    } catch (error) {
      console.error('❌ Error sending payment notifications:', error);
      // Don't throw here as payment is already completed
    }
  }

  // Handle payment failure
  static async handlePaymentFailure(orderId, reason, errorCode = null) {
    try {
      const milestone = await Milestone.findOne({ paymentId: orderId });
      if (milestone) {
        milestone.paymentStatus = 'failed';
        milestone.paymentFailureReason = reason;
        milestone.paymentFailureCode = errorCode;
        await milestone.save();
        
        console.log('❌ Payment failure recorded:', {
          milestoneId: milestone._id,
          orderId,
          reason,
          errorCode
        });
      }
    } catch (error) {
      console.error('❌ Error handling payment failure:', error);
    }
  }

  // Get payment history for a workspace
  static async getPaymentHistory(workspaceId) {
    try {
      const milestones = await Milestone.find({
        workspace: workspaceId,
        paymentStatus: 'completed'
      })
      .select('title amount currency paidDate paymentDetails')
      .sort({ paidDate: -1 });

      const totalPaid = milestones.reduce((sum, milestone) => sum + milestone.amount, 0);

      return {
        payments: milestones,
        totalPaid,
        paymentCount: milestones.length
      };
    } catch (error) {
      console.error('❌ Error fetching payment history:', error);
      throw error;
    }
  }

  // Create milestone escrow (redirects to EscrowService)
  static async createEscrow(milestoneId, clientId) {
    return await EscrowService.createEscrowPayment(milestoneId, clientId);
  }

  // Release escrow funds (redirects to EscrowService)
  static async releaseEscrow(milestoneId, adminId = 'system', releaseReason = '') {
    return await EscrowService.releaseFunds(milestoneId, adminId, releaseReason);
  }

  // Submit deliverable for escrow
  static async submitDeliverable(milestoneId, freelancerId, submissionData) {
    return await EscrowService.submitDeliverable(milestoneId, freelancerId, submissionData);
  }

  // Approve/reject deliverable
  static async approveDeliverable(milestoneId, clientId, approvalData) {
    return await EscrowService.approveDeliverable(milestoneId, clientId, approvalData);
  }

  // Raise dispute
  static async raiseDispute(milestoneId, userId, disputeReason) {
    return await EscrowService.raiseDispute(milestoneId, userId, disputeReason);
  }

  // Resolve dispute (admin only)
  static async resolveDispute(milestoneId, adminId, resolutionData) {
    return await EscrowService.resolveDispute(milestoneId, adminId, resolutionData);
  }

  // Get escrow details
  static async getEscrowDetails(milestoneId) {
    return await EscrowService.getEscrowDetails(milestoneId);
  }

  // Get escrow history
  static async getEscrowHistory(workspaceId) {
    return await EscrowService.getEscrowHistory(workspaceId);
  }
}

module.exports = PaymentService;