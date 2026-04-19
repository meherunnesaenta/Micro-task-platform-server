const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const mongoose = require('mongoose');
const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authMiddleware, authorize } = require('../middleware/auth');

// Submit a task (Worker)
router.post('/', authMiddleware, authorize('worker'), async (req, res) => {
  try {
    const { task_id, submission_details } = req.body;

    console.log('=== SUBMIT TASK DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Task ID:', task_id);
    console.log('Submission details:', submission_details);
    console.log('User from token:', req.user);

    // Validation
    if (!task_id) {
      console.log('Missing task_id');
      return res.status(400).json({ error: 'Task ID is required' });
    }

    if (!submission_details) {
      console.log('Missing submission_details');
      return res.status(400).json({ error: 'Submission details are required' });
    }

    // Find task
    const task = await Task.findById(task_id);
    console.log('Task found:', task ? 'Yes' : 'No');

    if (!task) {
      console.log('Task not found for ID:', task_id);
      return res.status(404).json({ error: 'Task not found' });
    }

    console.log('Task details:', {
      task_title: task.task_title,
      required_workers: task.required_workers,
      buyer_email: task.buyer_email
    });

    // Check if task is still active
    if (task.required_workers <= 0) {
      console.log('Task no longer accepting submissions');
      return res.status(400).json({ error: 'This task is no longer accepting submissions' });
    }

    // Get worker
    const worker = await User.findById(req.user.userId);
    console.log('Worker found:', worker ? 'Yes' : 'No');

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    // Check if worker already submitted for this task
    const existingSubmission = await Submission.findOne({
      task_id: task_id,
      worker_email: worker.email,
    });

    if (existingSubmission) {
      console.log('Worker already submitted for this task');
      return res.status(400).json({ error: 'You have already submitted for this task' });
    }

    // Create submission
    const submission = new Submission({
      task_id: task._id,
      task_title: task.task_title,
      payable_amount: task.payable_amount,
      worker_email: worker.email,
      worker_name: worker.name,
      submission_details: submission_details,
      buyer_email: task.buyer_email,
      buyer_name: task.buyer_name,
      status: 'pending',
      submitted_date: new Date()
    });

    await submission.save();
    console.log('Submission saved with ID:', submission._id);

    // Create notification for buyer
    try {
      const Notification = require('../models/Notification');
      const notification = new Notification({
        toEmail: task.buyer_email,
        message: `New submission from ${worker.name} for task "${task.task_title}"`,
        type: 'submission',
        createdAt: new Date()
      });
      await notification.save();
      console.log('Notification sent to buyer');
    } catch (notifError) {
      console.log('Notification error (non-critical):', notifError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Submission created successfully',
      submission: {
        _id: submission._id,
        task_title: submission.task_title,
        status: submission.status
      }
    });

  } catch (error) {
    console.error('Submit task error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get worker's submissions
router.get('/worker/my-submissions', authMiddleware, authorize('worker'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const worker = await User.findById(req.user.userId);
    const submissions = await Submission.find({ worker_email: worker.email })
      .sort('-submitted_date')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Submission.countDocuments({ worker_email: worker.email });

    res.json({
      submissions,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get buyer's task submissions for review
router.get('/buyer/review', authMiddleware, authorize('buyer'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const buyer = await User.findById(req.user.userId);
    const submissions = await Submission.find({
      buyer_email: buyer.email,
      status: 'pending',
    })
      .sort('-submitted_date')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Submission.countDocuments({
      buyer_email: buyer.email,
      status: 'pending',
    });

    res.json({
      submissions,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve submission
router.put('/:id/approve', authMiddleware, authorize('buyer'), async (req, res) => {
  try {
    const { id } = req.params;

    console.log('=== APPROVE SUBMISSION DEBUG ===');
    console.log('Submission ID:', id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid submission ID format' });
    }

    const submission = await Submission.findById(id);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (submission.status !== 'pending') {
      return res.status(400).json({ error: `Submission already ${submission.status}` });
    }

    if (submission.buyer_email !== req.user.email) {
      return res.status(403).json({ error: 'Not authorized to approve this submission' });
    }

    // Update submission status
    submission.status = 'approved';
    submission.reviewed_date = new Date();
    await submission.save();
    console.log('Submission status updated to approved');

    // ✅ Add coins to worker (1 USD = 20 coins)
    const worker = await User.findOne({ email: submission.worker_email });
    console.log('Worker found:', worker ? 'Yes' : 'No');
    console.log('Payable amount in USD:', submission.payable_amount);

    if (worker) {
      // ✅ Only add coins, no USD calculation display
      const coinsToAdd = submission.payable_amount * 20;
      console.log('Adding coins:', coinsToAdd);

      worker.coins += coinsToAdd;
      await worker.save();
console.log('✅ COINS ONLY - New worker coin balance:', worker.coins);
// ✅ COINS ONLY - No USD field exists on User model
      // console.log('Worker new USD value:', worker.coins / 20);
    } else {
      console.log('Worker not found - skipping coin addition');
    }

    // Update task required_workers
    const task = await Task.findById(submission.task_id);
    if (task && task.required_workers > 0) {
      task.required_workers -= 1;
      await task.save();
      console.log('Task updated. New required_workers:', task.required_workers);
    }

    // Create notification
    try {
      const Notification = require('../models/Notification');
      const notification = new Notification({
        toEmail: submission.worker_email,
        message: `Your submission for "${submission.task_title}" has been approved! You earned ${submission.payable_amount * 20} coins.`,
        type: 'submission',
      });
      await notification.save();
      console.log('Notification sent');
    } catch (notifError) {
      console.log('Notification error:', notifError.message);
    }

    // ✅ Return only coins added, not USD value
    res.json({
      success: true,
      message: 'Submission approved successfully',
      coinsAdded: submission.payable_amount * 20,
      workerNewBalance: worker?.coins
    });

  } catch (error) {
    console.error('Error approving submission:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reject submission (Buyer)
router.put('/:id/reject', authMiddleware, authorize('buyer'), async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (submission.buyer_email !== req.user.email) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    submission.status = 'rejected';
    submission.reviewed_date = new Date();
    await submission.save();

    // Increase required_workers count
    const task = await Task.findById(submission.task_id);
    if (task) {
      task.required_workers += 1;
      task.status = 'active';
      await task.save();
    }

    // Create notification for worker
    const notification = new Notification({
      toEmail: submission.worker_email,
      message: `Your submission for "${submission.task_title}" has been rejected. Please try again or contact the buyer.`,
      actionRoute: '/dashboard/worker-submissions',
      type: 'rejection',
    });

    await notification.save();

    res.json({
      message: 'Submission rejected',
      submission,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get approved submissions for worker (earnings)
router.get('/worker/approved', authMiddleware, authorize('worker'), async (req, res) => {
  try {
    console.log('=== WORKER APPROVED DEBUG ===');
    console.log('User ID:', req.user.userId);

    const worker = await User.findById(req.user.userId);
    console.log('Worker email:', worker.email);

    const approvedSubmissions = await Submission.find({
      worker_email: worker.email,
      status: 'approved',
    }).sort('-reviewed_date');

    // ✅ Calculate total earnings in COINS (20 coins = $1)
    const totalEarningsInCoins = approvedSubmissions.reduce(
      (sum, sub) => sum + (sub.payable_amount * 20),  // ✅ Convert dollars to coins
      0
    );

    console.log('Approved submissions found:', approvedSubmissions.length);
    console.log('Total earnings in COINS:', totalEarningsInCoins);
    console.log('Total earnings in USD:', totalEarningsInCoins / 20);

    res.json({
      approvedSubmissions,
      totalEarnings: totalEarningsInCoins,  // ✅ Return COINS
    });
  } catch (error) {
    console.error('Worker approved error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get submissions for a specific task (Fixed for both buyer & worker)
router.get('/task/:taskId', authMiddleware, async (req, res) => {
  try {
    const { taskId } = req.params;

    console.log('=== SUBMISSIONS/TASK DEBUG ===');
    console.log('Task ID:', taskId);

    // Get submissions for this task (worker or buyer can view their own)
    const submissions = await Submission.find({ task_id: taskId })
      .populate('worker_id', 'name email photoURL')
      .populate('task_id', 'task_title payable_amount task_detail')
      .sort('-submitted_date');

    console.log('Found submissions for task:', submissions.length);

    res.json({
      submissions,
      total: submissions.length,
    });
  } catch (error) {
    console.error('Task submissions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ NEW: Get single submission by ID (for WorkerSubmissionDetails)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    console.log('=== SINGLE SUBMISSION DEBUG ===');
    console.log('Submission ID:', req.params.id);
    console.log('User ID from token:', req.user.userId);

    const submission = await Submission.findById(req.params.id)
      .populate('worker_id', 'name email photoURL')
      .populate('task_id', 'task_title payable_amount task_detail submission_info');

    if (!submission) {
      console.log('Submission not found for ID:', req.params.id);
      return res.status(404).json({ error: 'Submission not found' });
    }

    console.log('Found submission:', submission._id, 'worker_email:', submission.worker_email, 'buyer_email:', submission.buyer_email);

    // Worker can view own submissions, buyer can view their task submissions
    const user = await User.findById(req.user.userId);
    console.log('User role:', user.role, 'email:', user.email);

    if (submission.worker_email !== user.email && submission.buyer_email !== user.email) {
      console.log('Authorization failed - user email:', user.email, 'submission emails:', submission.worker_email, submission.buyer_email);
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json({
      submission,
    });
  } catch (error) {
    console.error('Single submission error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all submissions
router.get('/', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const submissions = await Submission.find()
      .sort('-submitted_date')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Submission.countDocuments();

    res.json({
      submissions,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
