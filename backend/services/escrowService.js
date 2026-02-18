const Razorpay = require('razorpay');
const crypto = require('crypto');
const Escrow = require('../models/Escrow');
const Milestone = require('../models/Milestone');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const { sendEmail } = require('../utils/brevoEmailService');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'your_razorpay_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_razorpay_key_secret'
});

class EscrowService {
  
  /**
   * Get service charge percentage based on project budget tier
   * Budget tiers:
   * - Under ₹5,000: 8%
   * - ₹5,000 - ₹20,000: 6%
   * - ₹20,000 - ₹50,000: 5%
   * - ₹50,000 - ₹1,00,000: 4%
   * - Above ₹1,00,000: 3%
   */
  static getServiceChargePercentage(projectBudget) {
    if (projectBudget < 5000) {
      return 8; // 8% for small projects
    } else if (projectBudget < 20000) {
      return 6; // 6% for medium projects
    } else if (projectBudget < 50000) {
      return 5; // 5% for medium-large projects
    } else if (projectBudget < 100000) {
      return 4; // 4% for large projects
    } else {
      return 3; // 3% for very large projects
    }
  }
  
  /**
   * Calculate service charges and total amount
   */
  static calculateServiceCharges(milestoneAmount, projectBudget = null, serviceChargePercentage = null) {
    // If projectBudget is provided, calculate percentage based on tier
    // Otherwise use the provided percentage, or default to 5%
    const chargePercentage = projectBudget 
      ? this.getServiceChargePercentage(projectBudget)
      : (serviceChargePercentage || 5);
    
    const totalServiceCharge = (milestoneAmount * chargePercentage) / 100;
    const totalAmount = milestoneAmount + totalServiceCharge;
    const amountToFreelancer = milestoneAmount; // Freelancer gets the milestone amount
    
    return {
      milestoneAmount,
      serviceCharge: totalServiceCharge,
      serviceChargePercentage: chargePercentage,
      totalAmount,
      amountToFreelancer,
      breakdown: {
        projectBudget,
        percentageCharge: totalServiceCharge,
        appliedPercentage: chargePercentage
      }
    };
  }

  /**
   * Create escrow payment order
   */
  static async createEscrowPayment(milestoneId, clientId) {
    try {
      console.log('🏦 EscrowService: Creating escrow payment for milestone:', milestoneId);

      const milestone = await Milestone.findById(milestoneId)
        .populate('workspace')
        .populate({
          path: 'workspace',
          populate: {
            path: 'client freelancer project',
            select: 'fullName email'
          }
        });

      if (!milestone) {
        throw new Error('Milestone not found');
      }

      // Verify client authorization
      if (milestone.workspace.client._id.toString() !== clientId) {
        throw new Error('Unauthorized: Only the client can initiate payment');
      }

      // Check if escrow already exists and is active
      const existingEscrow = await Escrow.findOne({ milestone: milestoneId });
      if (existingEscrow) {
        if (existingEscrow.status === 'active' || existingEscrow.status === 'released' || existingEscrow.status === 'disputed') {
          throw new Error('Escrow already exists for this milestone');
        }
        // Delete incomplete/pending escrows to allow retry
        if (existingEscrow.status === 'pending' || existingEscrow.status === 'cancelled') {
          await Escrow.deleteOne({ _id: existingEscrow._id });
          console.log('🗑️ Cleaned up incomplete escrow record');
        }
      }

      // Calculate service charges based on project budget tier
      const projectBudget = milestone.workspace.project?.budgetAmount || null;
      const charges = this.calculateServiceCharges(
        milestone.amount,
        projectBudget,
        null // Let it auto-calculate based on budget tier
      );

      // Create Razorpay order
      const receipt = `escrow_${milestone._id.toString().slice(-8)}_${Date.now().toString().slice(-6)}`;
      
      const order = await razorpay.orders.create({
        amount: Math.round(charges.totalAmount * 100), // Convert to paise
        currency: milestone.currency || 'INR',
        receipt: receipt,
        notes: {
          milestone_id: milestone._id.toString(),
          workspace_id: milestone.workspace._id.toString(),
          client_id: clientId,
          freelancer_id: milestone.workspace.freelancer._id.toString(),
          escrow: 'true',
          total_amount: charges.totalAmount,
          service_charge: charges.serviceCharge
        }
      });

      // Create escrow record
      const escrow = new Escrow({
        milestone: milestone._id,
        workspace: milestone.workspace._id,
        client: clientId,
        freelancer: milestone.workspace.freelancer._id,
        totalAmount: charges.totalAmount,
        milestoneAmount: charges.milestoneAmount,
        serviceCharge: charges.serviceCharge,
        serviceChargePercentage: charges.serviceChargePercentage,
        amountToFreelancer: charges.amountToFreelancer,
        paymentId: order.id,
        razorpayOrderId: order.id,
        status: 'pending'
      });

      await escrow.save();

      // Update milestone
      milestone.escrowStatus = 'pending';
      milestone.paymentStatus = 'processing';
      milestone.totalAmountPaid = charges.totalAmount;
      milestone.amountToFreelancer = charges.amountToFreelancer;
      milestone.serviceCharge = charges.serviceCharge;
      await milestone.save();

      console.log('✅ Escrow payment order created successfully');

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        escrowId: escrow._id,
        chargeBreakdown: charges,
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
      console.error('❌ Error creating escrow payment:', error);
      throw error;
    }
  }

  /**
   * Verify escrow payment and activate escrow
   */
  static async verifyAndActivateEscrow(paymentData) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, milestone_id } = paymentData;

      console.log('🔍 Verifying escrow payment:', razorpay_payment_id);

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

      // Find escrow and milestone
      const escrow = await Escrow.findOne({ 
        milestone: milestone_id,
        razorpayOrderId: razorpay_order_id 
      });

      if (!escrow) {
        throw new Error('Escrow not found');
      }

      const milestone = await Milestone.findById(milestone_id)
        .populate('workspace')
        .populate({
          path: 'workspace',
          populate: {
            path: 'client freelancer',
            select: 'fullName email'
          }
        });

      // Update escrow status
      escrow.status = 'active';
      escrow.razorpayPaymentId = razorpay_payment_id;
      escrow.razorpaySignature = razorpay_signature;
      escrow.activatedAt = new Date();
      escrow.notificationsSent.paymentReceived = false; // Will send notification
      await escrow.save();

      // Update milestone
      milestone.escrowStatus = 'active';
      milestone.paymentStatus = 'completed';
      milestone.paidDate = new Date();
      milestone.paymentDetails = {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        amount: payment.amount / 100,
        currency: payment.currency,
        method: payment.method,
        paidAt: new Date(payment.created_at * 1000)
      };
      await milestone.save();

      // Send notifications
      await this.sendEscrowNotifications(escrow, 'payment_received');

      console.log('✅ Escrow payment verified and activated');

      return {
        success: true,
        escrow,
        milestone,
        payment: {
          id: razorpay_payment_id,
          amount: escrow.totalAmount,
          currency: milestone.currency,
          status: 'completed'
        }
      };

    } catch (error) {
      console.error('❌ Error verifying escrow payment:', error);
      throw error;
    }
  }

  /**
   * Submit deliverable and mark for client approval
   */
  static async submitDeliverable(milestoneId, freelancerId, submissionData) {
    try {
      console.log('📦 Submitting deliverable for milestone:', milestoneId);

      const escrow = await Escrow.findOne({ milestone: milestoneId });
      if (!escrow || escrow.status !== 'active') {
        throw new Error('No active escrow found for this milestone');
      }

      // Verify freelancer authorization
      if (escrow.freelancer.toString() !== freelancerId) {
        throw new Error('Unauthorized: Only the assigned freelancer can submit deliverables');
      }

      // Update milestone
      const milestone = await Milestone.findById(milestoneId);
      milestone.status = 'review';
      milestone.deliveryStatus = 'delivered'; // Mark as delivered when freelancer submits
      milestone.submittedBy = freelancerId;
      milestone.submissionDate = new Date();
      milestone.submissionNotes = submissionData.notes || '';
      
      if (submissionData.attachments) {
        milestone.attachments.push(...submissionData.attachments);
      }
      
      await milestone.save();

      // Update escrow
      escrow.deliverableSubmitted = true;
      escrow.deliverableSubmittedAt = new Date();
      escrow.clientApprovalStatus = 'pending';
      escrow.notificationsSent.deliverableSubmitted = false;
      await escrow.save();

      // Send notifications
      await this.sendEscrowNotifications(escrow, 'deliverable_submitted');

      console.log('✅ Deliverable submitted successfully');

      return {
        success: true,
        escrow,
        milestone,
        message: 'Deliverable submitted for client review'
      };

    } catch (error) {
      console.error('❌ Error submitting deliverable:', error);
      throw error;
    }
  }

  /**
   * Client approve/reject deliverable
   */
  static async approveDeliverable(milestoneId, clientId, approvalData) {
    try {
      console.log('✅ Processing deliverable approval for milestone:', milestoneId);

      const escrow = await Escrow.findOne({ milestone: milestoneId })
        .populate('milestone workspace client freelancer');
      
      if (!escrow || escrow.status !== 'active') {
        throw new Error('No active escrow found for this milestone');
      }

      // Verify client authorization
      if (escrow.client._id.toString() !== clientId) {
        throw new Error('Unauthorized: Only the client can approve deliverables');
      }

      const { approved, notes } = approvalData;

      // Update milestone
      const milestone = await Milestone.findById(milestoneId);
      
      if (approved) {
        milestone.status = 'approved';
        escrow.clientApprovalStatus = 'approved';
        escrow.clientApprovedAt = new Date();
        escrow.clientApprovedBy = clientId;
      } else {
        milestone.status = 'rejected';
        escrow.clientApprovalStatus = 'rejected';
      }

      milestone.reviewDate = new Date();
      milestone.reviewedBy = clientId;
      milestone.reviewNotes = notes || '';
      await milestone.save();

      // Also ensure deliverableSubmitted is true (fix data sync)
      if (!escrow.deliverableSubmitted) {
        escrow.deliverableSubmitted = true;
        escrow.deliverableSubmittedAt = escrow.deliverableSubmittedAt || new Date();
      }

      await escrow.save();

      // Send appropriate notifications
      if (approved) {
        await this.sendEscrowNotifications(escrow, 'client_approved');
        
        // Auto-release funds after client approval (no admin approval needed)
        try {
          await this.releaseFunds(milestoneId, 'system', 'Auto-release after client approval');
          console.log('✅ Funds auto-released after client approval');
        } catch (releaseErr) {
          console.log('ℹ️ Auto-release after approval not triggered:', releaseErr.message);
        }
      } else {
        await this.sendEscrowNotifications(escrow, 'client_rejected');
      }

      console.log('✅ Deliverable approval processed with notifications');

      return {
        success: true,
        approved,
        escrow,
        milestone
      };

    } catch (error) {
      console.error('❌ Error processing deliverable approval:', error);
      throw error;
    }
  }

  /**
   * Sync escrow flags with actual milestone/deliverable data
   * Fixes data inconsistencies where escrow flags are out of sync
   */
  static async syncEscrowState(escrow) {
    try {
      const Deliverable = require('../models/Deliverable');
      const milestoneId = escrow.milestone._id || escrow.milestone;

      // Check actual deliverable status from Deliverable collection
      const deliverables = await Deliverable.find({ milestone: milestoneId }).sort({ submissionDate: -1 });
      
      // Check milestone status directly
      const milestone = await Milestone.findById(milestoneId);

      let needsSave = false;

      // Sync deliverableSubmitted: true if ANY deliverable exists for this milestone
      // or if the milestone itself shows delivered/submitted
      const hasSubmittedDeliverable = deliverables.length > 0;
      const milestoneDelivered = milestone && (
        milestone.deliveryStatus === 'delivered' || 
        milestone.submittedBy || 
        milestone.submissionDate
      );

      if (!escrow.deliverableSubmitted && (hasSubmittedDeliverable || milestoneDelivered)) {
        console.log('🔄 Syncing escrow: deliverableSubmitted → true (was false)');
        escrow.deliverableSubmitted = true;
        escrow.deliverableSubmittedAt = escrow.deliverableSubmittedAt || 
          (deliverables[0]?.submissionDate) || 
          (milestone?.submissionDate) || 
          new Date();
        needsSave = true;
      }

      // Sync clientApprovalStatus: if any deliverable is approved, escrow should reflect that
      const hasApprovedDeliverable = deliverables.some(d => d.status === 'approved');
      const milestoneApproved = milestone && milestone.status === 'approved';

      if (escrow.clientApprovalStatus !== 'approved' && (hasApprovedDeliverable || milestoneApproved)) {
        console.log(`🔄 Syncing escrow: clientApprovalStatus → approved (was ${escrow.clientApprovalStatus})`);
        escrow.clientApprovalStatus = 'approved';
        escrow.clientApprovedAt = escrow.clientApprovedAt || 
          deliverables.find(d => d.status === 'approved')?.reviewDate || 
          milestone?.reviewDate || 
          new Date();
        needsSave = true;
      }

      // If deliverable was re-submitted after rejection, reset from 'rejected' to 'pending'
      if (escrow.clientApprovalStatus === 'rejected') {
        const latestDeliverable = deliverables[0];
        if (latestDeliverable && latestDeliverable.status === 'submitted' && 
            latestDeliverable.submissionDate > (escrow.clientApprovedAt || new Date(0))) {
          console.log('🔄 Syncing escrow: clientApprovalStatus → pending (new deliverable after rejection)');
          escrow.clientApprovalStatus = 'pending';
          needsSave = true;
        }
      }

      if (needsSave) {
        await escrow.save();
        console.log('✅ Escrow state synced with actual milestone/deliverable data');
      }

      return { hasSubmittedDeliverable, hasApprovedDeliverable, milestoneApproved, milestoneDelivered };
    } catch (error) {
      console.error('⚠️ Error syncing escrow state:', error.message);
      return {};
    }
  }

  /**
   * Admin release funds to freelancer
   */
  static async releaseFunds(milestoneId, adminId, releaseReason = '') {
    try {
      console.log('💰 Releasing escrow funds for milestone:', milestoneId);

      const escrow = await Escrow.findOne({ milestone: milestoneId })
        .populate('milestone workspace client freelancer');
      
      if (!escrow) {
        throw new Error('No escrow found for this milestone');
      }

      // If already released, return success instead of throwing
      if (escrow.status === 'released') {
        console.log(`ℹ️ Escrow for milestone ${milestoneId} already released at ${escrow.releasedAt}`);
        return {
          success: true,
          escrow,
          milestone: escrow.milestone,
          amountReleased: escrow.amountToFreelancer,
          alreadyReleased: true,
          message: 'Funds have already been released to the freelancer'
        };
      }

      if (escrow.status !== 'active') {
        throw new Error(`Cannot release funds: Escrow status is "${escrow.status}", expected "active"`);
      }

      const isAdminRelease = adminId && adminId !== 'system';

      // For system auto-release, do a best-effort eligibility check
      // For admin release, skip validation — admin authority overrides data flags
      if (!isAdminRelease) {
        // Sync escrow flags with actual milestone/deliverable data
        const syncResult = await this.syncEscrowState(escrow);
        await escrow.populate('milestone workspace client freelancer');

        const isDeliverableReady = escrow.deliverableSubmitted || 
          syncResult.hasSubmittedDeliverable || 
          syncResult.milestoneDelivered;
        
        const isApprovalValid = (escrow.clientApprovalStatus !== 'rejected') || 
          syncResult.hasApprovedDeliverable || 
          syncResult.milestoneApproved;

        if (!isDeliverableReady || !isApprovalValid) {
          throw new Error('Cannot release funds: Deliverable not submitted or rejected by client');
        }
      } else {
        // Admin release — just sync state for logging, never block
        console.log('👑 Admin-initiated release — bypassing deliverable validation');
        console.log(`   Escrow flags: deliverableSubmitted=${escrow.deliverableSubmitted}, clientApprovalStatus=${escrow.clientApprovalStatus}`);
        try {
          await this.syncEscrowState(escrow);
          await escrow.populate('milestone workspace client freelancer');
        } catch (syncErr) {
          console.warn('⚠️ State sync failed (non-blocking for admin):', syncErr.message);
        }
      }

      // Update escrow
      escrow.status = 'released';
      escrow.releasedAt = new Date();
      escrow.releasedBy = adminId !== 'system' ? adminId : null;
      escrow.releaseReason = releaseReason;
      await escrow.save();

      // Update milestone
      const milestone = await Milestone.findById(milestoneId);
      milestone.escrowStatus = 'released';
      milestone.status = 'paid';
      milestone.escrowReleasedAt = new Date();
      milestone.escrowReleasedBy = adminId !== 'system' ? adminId : null;
      await milestone.save();

      // Update freelancer earnings
      const freelancer = await User.findById(escrow.freelancer._id);
      freelancer.totalEarnings = (freelancer.totalEarnings || 0) + escrow.amountToFreelancer;
      freelancer.completedProjects = (freelancer.completedProjects || 0) + 1;
      await freelancer.save();

      // Send notifications
      await this.sendEscrowNotifications(escrow, 'funds_released');

      console.log(`✅ Funds released: ₹${escrow.amountToFreelancer} to freelancer`);

      return {
        success: true,
        escrow,
        milestone,
        amountReleased: escrow.amountToFreelancer,
        message: 'Funds released to freelancer successfully'
      };

    } catch (error) {
      console.error('❌ Error releasing funds:', error);
      throw error;
    }
  }

  /**
   * Raise dispute
   */
  static async raiseDispute(milestoneId, userId, disputeReason) {
    try {
      console.log('⚠️ Raising dispute for milestone:', milestoneId);

      const escrow = await Escrow.findOne({ milestone: milestoneId });
      
      if (!escrow || escrow.status !== 'active') {
        throw new Error('No active escrow found for dispute');
      }

      // Verify user can raise dispute (client or freelancer)
      const isAuthorized = escrow.client.toString() === userId || 
                          escrow.freelancer.toString() === userId;
      
      if (!isAuthorized) {
        throw new Error('Unauthorized: Only client or freelancer can raise disputes');
      }

      // Update escrow
      escrow.disputeRaised = true;
      escrow.disputeRaisedAt = new Date();
      escrow.disputeRaisedBy = userId;
      escrow.disputeReason = disputeReason;
      escrow.status = 'disputed';
      await escrow.save();

      // Update milestone
      const milestone = await Milestone.findById(milestoneId);
      milestone.escrowStatus = 'disputed';
      milestone.status = 'disputed';
      await milestone.save();

      // Send notifications to admin
      await this.sendEscrowNotifications(escrow, 'dispute_raised');

      console.log('⚠️ Dispute raised successfully');

      return {
        success: true,
        escrow,
        milestone,
        message: 'Dispute raised. Admin will review and resolve.'
      };

    } catch (error) {
      console.error('❌ Error raising dispute:', error);
      throw error;
    }
  }

  /**
   * Admin resolve dispute
   */
  static async resolveDispute(milestoneId, adminId, resolutionData) {
    try {
      console.log('🔧 Resolving dispute for milestone:', milestoneId);

      const { resolution, refundToClient, releaseToFreelancer, notes } = resolutionData;

      const escrow = await Escrow.findOne({ milestone: milestoneId });
      
      if (!escrow || escrow.status !== 'disputed') {
        throw new Error('No disputed escrow found');
      }

      // Update escrow
      escrow.disputeResolution = resolution;
      escrow.disputeResolvedAt = new Date();
      escrow.disputeResolvedBy = adminId;
      escrow.releaseNotes = notes;

      if (releaseToFreelancer) {
        escrow.status = 'released';
        escrow.releasedAt = new Date();
        escrow.releasedBy = adminId;
        
        // Update freelancer earnings
        const freelancer = await User.findById(escrow.freelancer);
        freelancer.totalEarnings = (freelancer.totalEarnings || 0) + escrow.amountToFreelancer;
        await freelancer.save();
      } else if (refundToClient) {
        escrow.status = 'refunded';
        escrow.refundedAt = new Date();
        escrow.refundedBy = adminId;
        escrow.refundReason = notes;
        escrow.refundAmount = escrow.totalAmount;
      }

      await escrow.save();

      // Update milestone
      const milestone = await Milestone.findById(milestoneId);
      milestone.escrowStatus = escrow.status;
      milestone.status = escrow.status === 'released' ? 'paid' : 'refunded';
      await milestone.save();

      console.log('✅ Dispute resolved successfully');

      return {
        success: true,
        escrow,
        milestone,
        resolution,
        message: 'Dispute resolved successfully'
      };

    } catch (error) {
      console.error('❌ Error resolving dispute:', error);
      throw error;
    }
  }

  /**
   * Get escrow details
   */
  static async getEscrowDetails(milestoneId) {
    try {
      const escrow = await Escrow.findOne({ milestone: milestoneId })
        .populate('milestone workspace client freelancer releasedBy disputeResolvedBy')
        .populate({
          path: 'workspace',
          populate: {
            path: 'project',
            select: 'title'
          }
        });

      return escrow;
    } catch (error) {
      console.error('❌ Error fetching escrow details:', error);
      throw error;
    }
  }

  /**
   * Get escrow history for workspace
   */
  static async getEscrowHistory(workspaceId) {
    try {
      const escrows = await Escrow.find({ workspace: workspaceId })
        .populate('milestone client freelancer releasedBy')
        .sort({ createdAt: -1 });

      return escrows;
    } catch (error) {
      console.error('❌ Error fetching escrow history:', error);
      throw error;
    }
  }

  /**
   * Auto-release funds for eligible escrows
   * Releases immediately when deliverable is submitted AND approved by client
   * Also releases after timeout period if no disputes
   */
  static async processAutoReleases() {
    try {
      console.log('🤖 Processing auto-releases...');

      // Find ALL active, non-disputed escrows (don't rely solely on escrow flags)
      const activeEscrows = await Escrow.find({
        status: 'active',
        disputeRaised: false
      }).populate('milestone');

      let releasedCount = 0;

      for (const escrow of activeEscrows) {
        try {
          // Sync escrow state with actual data first
          const syncResult = await this.syncEscrowState(escrow);

          // Condition 1: Deliverable submitted AND approved by client → release immediately
          const isApproved = escrow.clientApprovalStatus === 'approved' || 
            syncResult.hasApprovedDeliverable || 
            syncResult.milestoneApproved;
          
          const isSubmitted = escrow.deliverableSubmitted || 
            syncResult.hasSubmittedDeliverable || 
            syncResult.milestoneDelivered;

          if (isSubmitted && isApproved) {
            console.log(`✅ Auto-releasing escrow for milestone ${escrow.milestone._id || escrow.milestone}: deliverable submitted & approved`);
            await this.releaseFunds(escrow.milestone._id || escrow.milestone, 'system', 'Auto-release: deliverable submitted and approved by client');
            releasedCount++;
            continue;
          }

          // Condition 2: Auto-release after timeout (deliverable submitted, pending approval, no disputes)
          if (isSubmitted && escrow.clientApprovalStatus !== 'rejected' && escrow.isAutoReleaseDue) {
            console.log(`✅ Auto-releasing escrow for milestone ${escrow.milestone._id || escrow.milestone}: timeout reached`);
            await this.releaseFunds(escrow.milestone._id || escrow.milestone, 'system', 'Auto-release after timeout period');
            releasedCount++;
          }
        } catch (releaseError) {
          console.error(`⚠️ Failed to auto-release escrow ${escrow._id}:`, releaseError.message);
          // Continue with other escrows
        }
      }

      console.log(`✅ Auto-released ${releasedCount} escrows`);
      return releasedCount;

    } catch (error) {
      console.error('❌ Error processing auto-releases:', error);
      throw error;
    }
  }

  /**
   * Send escrow-related notifications
   */
  static async sendEscrowNotifications(escrow, event) {
    try {
      console.log(`📧 Sending escrow notification: ${event} for milestone ${escrow.milestone._id}`);
      
      const Notification = require('../models/Notification');
      
      let notification;
      
      switch (event) {
        case 'payment_received':
          // Notify freelancer that client has paid
          notification = new Notification({
            userId: escrow.freelancer._id,
            userRole: 'freelancer',
            type: 'payment',
            title: '💰 Payment Received!',
            body: `Client has paid ₹${escrow.totalAmount} for milestone "${escrow.milestone.title}". Funds are held in escrow until deliverable approval.`,
            icon: '/payment-icon.png',
            data: {
              workspaceId: escrow.workspace._id,
              milestoneId: escrow.milestone._id,
              extraData: {
                amount: escrow.amountToFreelancer,
                serviceCharge: escrow.serviceCharge,
                totalPaid: escrow.totalAmount,
                event: 'payment_received'
              }
            }
          });
          break;

        case 'deliverable_submitted':
          // Notify client that deliverable is ready for review
          notification = new Notification({
            userId: escrow.client._id,
            userRole: 'client',
            type: 'deliverable-reminder',
            title: '📦 Deliverable Submitted',
            body: `Freelancer has submitted deliverable for milestone "${escrow.milestone.title}". Please review and approve or request changes.`,
            icon: '/deliverable-icon.png',
            data: {
              workspaceId: escrow.workspace._id,
              milestoneId: escrow.milestone._id,
              extraData: {
                event: 'deliverable_submitted'
              }
            }
          });
          break;

        case 'funds_released':
          // Notify freelancer that funds have been released
          notification = new Notification({
            userId: escrow.freelancer._id,
            userRole: 'freelancer',
            type: 'payment',
            title: '🎉 Funds Released!',
            body: `Congratulations! ₹${escrow.amountToFreelancer} has been released to your account for milestone "${escrow.milestone.title}".`,
            icon: '/success-icon.png',
            data: {
              workspaceId: escrow.workspace._id,
              milestoneId: escrow.milestone._id,
              extraData: {
                amountReleased: escrow.amountToFreelancer,
                releaseReason: escrow.releaseReason,
                releasedAt: escrow.releasedAt,
                event: 'funds_released'
              }
            }
          });
          break;

        case 'client_approved':
          // Notify freelancer that deliverable was approved
          notification = new Notification({
            userId: escrow.freelancer._id,
            userRole: 'freelancer',
            type: 'deliverable-reminder',
            title: '✅ Deliverable Approved!',
            body: `Great work! Client has approved your deliverable for "${escrow.milestone.title}". Funds will be released by admin soon.`,
            icon: '/approved-icon.png',
            data: {
              workspaceId: escrow.workspace._id,
              milestoneId: escrow.milestone._id,
              extraData: {
                event: 'client_approved'
              }
            }
          });
          break;

        case 'client_rejected':
          // Notify freelancer that deliverable was rejected
          notification = new Notification({
            userId: escrow.freelancer._id,
            userRole: 'freelancer',
            type: 'deliverable-reminder',
            title: '🔄 Revision Requested',
            body: `Client has requested changes for milestone "${escrow.milestone.title}". Please check the feedback and resubmit.`,
            icon: '/revision-icon.png',
            data: {
              workspaceId: escrow.workspace._id,
              milestoneId: escrow.milestone._id,
              extraData: {
                event: 'client_rejected'
              }
            }
          });
          break;

        default:
          console.log(`📧 Unknown notification event: ${event}`);
          return;
      }

      if (notification) {
        await notification.save();
        console.log(`✅ Notification sent: ${notification.title} to ${notification.userRole}`);

        // Send real-time notification via socket if available
        try {
          const { getIO } = require('../utils/socketHandler');
          const io = getIO();
          io.to(notification.userId.toString()).emit('notification', {
            _id: notification._id,
            title: notification.title,
            body: notification.body,
            type: notification.type,
            createdAt: notification.createdAt,
            data: notification.data
          });
          console.log(`🔔 Real-time notification sent to user: ${notification.userId}`);
        } catch (socketError) {
          console.log(`⚠️ Could not send real-time notification: ${socketError.message}`);
        }

        // Send push notification if service is available
        try {
          const webpush = require('web-push');
          // Implementation would go here based on your push notification setup
          console.log(`📱 Push notification queued for user: ${notification.userId}`);
        } catch (pushError) {
          console.log(`⚠️ Could not send push notification: ${pushError.message}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Error sending escrow notifications:', error);
    }
  }
}

module.exports = EscrowService;