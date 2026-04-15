const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authMiddleware, authorize } = require('../middleware/auth');

// Submit a task (Worker)
router.post('/', authMiddleware, authorize('worker'), async (req, res) => {
  try {
    const { task_id, submission_details } = req.body;

    if (!task_id || !submission_details) {
      return res.status(400).json({ error: 'Task ID and submission details are required' });
    }

    const task = await Task.findById(task_id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const worker = await User.findById(req.user.userId);
    
    // Check if worker already submitted for this task
    const existingSubmission = await Submission.findOne({
      task_id,
      worker_email: worker.email,
    });

    if (existingSubmission) {
      return res
        .status(400)
        .json({ error: 'You have already submitted for this task' });
    }

    const submission = new Submission({
      task_id,
      task_title: task.task_title,
      payable_amount: task.payable_amount,
      worker_email: worker.email,
      worker_name: worker.name,
      submission_details,
      buyer_email: task.buyer_email,
      buyer_name: task.buyer_name,
      status: 'pending',
    });

    await submission.save();

    // Create notification for buyer
    const notification = new Notification({
      toEmail: task.buyer_email,
      message: `New submission from ${worker.name} for task "${task.task_title}"`,
      actionRoute: '/dashboard/buyer/review-submissions',
      type: 'submission',
    });

    await notification.save();

    res.status(201).json({
      message: 'Submission created successfully',
      submission,
    });
  } catch (error) {
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

// Approve submission (Buyer)
router.put('/:id/approve', authMiddleware, authorize('buyer'), async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (submission.buyer_email !== req.user.email) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    submission.status = 'approved';
    submission.reviewed_date = new Date();
    await submission.save();

    // Add coins to worker
    const worker = await User.findOne({ email: submission.worker_email });
    worker.coins += submission.payable_amount;
    await worker.save();

    // Reduce required_workers count for the task
    const task = await Task.findById(submission.task_id);
    if (task) {
      task.required_workers -= 1;
      if (task.required_workers === 0) {
        task.status = 'completed';
      }
      await task.save();
    }

    // Create notification for worker
    const notification = new Notification({
      toEmail: submission.worker_email,
      message: `Your submission for "${submission.task_title}" has been approved! You earned ${submission.payable_amount} coins from ${submission.buyer_name}.`,
      actionRoute: '/dashboard/worker-home',
      type: 'approval',
    });

    await notification.save();

    res.json({
      message: 'Submission approved',
      submission,
      workerNewBalance: worker.coins,
    });
  } catch (error) {
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
    const worker = await User.findById(req.user.userId);
    const approvedSubmissions = await Submission.find({
      worker_email: worker.email,
      status: 'approved',
    });

    const totalEarnings = approvedSubmissions.reduce(
      (sum, sub) => sum + sub.payable_amount,
      0
    );

    res.json({
      approvedSubmissions,
      totalEarnings,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
