const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User');
const { authMiddleware, authorize } = require('../middleware/auth');

// Get all available tasks (for workers)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = '-createdAt' } = req.query;
    const skip = (page - 1) * limit;

    const tasks = await Task.find({
      required_workers: { $gt: 0 },
      status: 'active',
      completion_date: { $gt: new Date() },
    })
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments({
      required_workers: { $gt: 0 },
      status: 'active',
      completion_date: { $gt: new Date() },
    });

    res.json({
      tasks,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single task details
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new task (Buyer only)
router.post('/', authMiddleware, authorize('buyer'), async (req, res) => {
  try {
    const {
      task_title,
      task_detail,
      required_workers,
      payable_amount,
      completion_date,
      submission_info,
      task_image_url,
    } = req.body;

    // Validation
    if (
      !task_title ||
      !task_detail ||
      !required_workers ||
      !payable_amount ||
      !completion_date ||
      !submission_info
    ) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const buyer = await User.findById(req.user.userId);
    const totalPayable = required_workers * payable_amount;

    // Check if buyer has enough coins
    if (buyer.coins < totalPayable) {
      return res.status(400).json({
        error: 'Not enough coins. Please purchase coins first.',
        required: totalPayable,
        available: buyer.coins,
      });
    }

    const task = new Task({
      task_title,
      task_detail,
      required_workers,
      payable_amount,
      completion_date,
      submission_info,
      task_image_url,
      buyer_email: buyer.email,
      buyer_name: buyer.name,
      buyer_id: buyer._id,
    });

    await task.save();

    // Deduct coins from buyer
    buyer.coins -= totalPayable;
    await buyer.save();

    res.status(201).json({
      message: 'Task created successfully',
      task,
      remainingCoins: buyer.coins,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get buyer's tasks
router.get('/buyer/my-tasks', authMiddleware, authorize('buyer'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const buyer = await User.findById(req.user.userId);
    const tasks = await Task.find({ buyer_email: buyer.email })
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments({ buyer_email: buyer.email });

    res.json({
      tasks,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update task (Buyer only)
router.put('/:id', authMiddleware, authorize('buyer'), async (req, res) => {
  try {
    const { task_title, task_detail, submission_info } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.buyer_email !== req.user.email) {
      return res.status(403).json({ error: 'Not authorized to update this task' });
    }

    task.task_title = task_title || task.task_title;
    task.task_detail = task_detail || task.task_detail;
    task.submission_info = submission_info || task.submission_info;

    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete task (Buyer only)
router.delete('/:id', authMiddleware, authorize('buyer'), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.buyer_email !== req.user.email) {
      return res.status(403).json({ error: 'Not authorized to delete this task' });
    }

    // Refund coins for uncompleted tasks
    const buyer = await User.findOne({ email: task.buyer_email });
    const refundAmount = task.required_workers * task.payable_amount;
    buyer.coins += refundAmount;
    await buyer.save();

    await Task.findByIdAndDelete(req.params.id);

    res.json({ message: 'Task deleted and coins refunded', refundedAmount: refundAmount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get top workers
router.get('/admin/top-workers', async (req, res) => {
  try {
    const topWorkers = await User.find({ role: 'worker' })
      .sort('-coins')
      .limit(6)
      .select('-password');

    res.json(topWorkers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
