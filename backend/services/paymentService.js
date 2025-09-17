// backend/services/paymentService.js
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Milestone = require('../models/Milestone');
const User = require('../models/User');
const { sendEmail } = require('../utils/brevoEmailService');

// Initialize Razorpay (You'll need to add these to your environment variables)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'your_razorpay_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_razorpay_key_secret'
});

class PaymentService {
  // Create a payment order for milestone
  static async createMilestonePayment(milestoneId, clientId) {
    try {
      const milestone = await Milestone.findById(milestoneId)
        .populate('workspace')
        .populate({
          path: 'workspace',
          populate: {
            path: 'client freelancer',
            select: 'fullName email'
          }
        });

      if (!milestone) {
        throw new Error('Milestone not found');
      }

      if (milestone.workspace.client._id.toString() !== clientId) {
        throw new Error('Unauthorized: Only the client can initiate payment');
      }

      if (milestone.status !== 'approved') {
        throw new Error('Milestone must be approved before payment');
      }

      if (milestone.paymentStatus === 'completed') {
        throw new Error('Milestone is already paid');
      }

      // Create Razorpay order
      const order = await razorpay.orders.create({
        amount: Math.round(milestone.amount * 100), // Convert to paise
        currency: milestone.currency || 'INR',
        receipt: `milestone_${milestone._id}_${Date.now()}`,
        notes: {
          milestone_id: milestone._id.toString(),
          workspace_id: milestone.workspace._id.toString(),
          client_id: clientId,
          freelancer_id: milestone.workspace.freelancer._id.toString()
        }
      });

      // Update milestone with payment details
      milestone.paymentStatus = 'processing';
      milestone.paymentId = order.id;
      await milestone.save();

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        milestone: {
          id: milestone._id,
          title: milestone.title,
          amount: milestone.amount
        },
        freelancer: {
          name: milestone.workspace.freelancer.fullName,
          email: milestone.workspace.freelancer.email
        }
      };
    } catch (error) {
      console.error('❌ Error creating milestone payment:', error);
      throw error;
    }
  }

  // Verify payment signature and complete payment
  static async verifyAndCompletePayment(paymentData) {
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
      console.error('❌ Error verifying payment:', error);
      throw error;
    }
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
  static async handlePaymentFailure(orderId, reason) {
    try {
      const milestone = await Milestone.findOne({ paymentId: orderId });
      if (milestone) {
        milestone.paymentStatus = 'failed';
        milestone.paymentFailureReason = reason;
        await milestone.save();
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

  // Create milestone escrow (for advanced payment protection)
  static async createEscrow(milestoneId, clientId) {
    try {
      // This would integrate with escrow services
      // For now, we'll simulate escrow by holding funds
      const milestone = await Milestone.findById(milestoneId);
      
      if (!milestone) {
        throw new Error('Milestone not found');
      }

      milestone.escrowStatus = 'active';
      milestone.escrowCreatedAt = new Date();
      await milestone.save();

      return { escrowId: `escrow_${milestone._id}`, status: 'active' };
    } catch (error) {
      console.error('❌ Error creating escrow:', error);
      throw error;
    }
  }

  // Release escrow funds
  static async releaseEscrow(milestoneId) {
    try {
      const milestone = await Milestone.findById(milestoneId);
      
      if (!milestone || milestone.escrowStatus !== 'active') {
        throw new Error('Invalid escrow release request');
      }

      milestone.escrowStatus = 'released';
      milestone.escrowReleasedAt = new Date();
      await milestone.save();

      return { status: 'released' };
    } catch (error) {
      console.error('❌ Error releasing escrow:', error);
      throw error;
    }
  }
}

module.exports = PaymentService;