const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User');

const Submission = require('../models/Submission');
const { authMiddleware, authorize } = require('../middleware/auth');



router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = '-createdAt' } = req.query;
    const skip = (page - 1) * limit;

    let taskQuery = {
      required_workers: { $gt: 0 },
      status: 'active',
      // completion_date: { $gt: new Date() }, // Temporarily disabled for testing - re-enable after verifying data flow
    };

    console.log('=== TASK DEBUG ===');
    console.log('Task Query:', JSON.stringify(taskQuery, null, 2));
    console.log('Current time:', new Date());

    // Exclude tasks worker already submitted
    if (req.user) {
      const workerSubmissions = await Submission.find({ worker_email: req.user.email }).select('task_id');
      const submittedTaskIds = workerSubmissions.map(s => s.task_id);
      taskQuery._id = { $nin: submittedTaskIds };
    }

    const tasks = await Task.find(taskQuery)
      .sort(sortBy)
      .skip(skip)
      .limit(parseInt(limit));

    const totalQuery = { ...taskQuery };
    if (req.user) {
      totalQuery._id = { $nin: submittedTaskIds };
    }
    const total = await Task.countDocuments(totalQuery);

    res.json({
      tasks,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error('Tasks error:', error);
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
      buyer_email,
      buyer_name,
      buyer_id
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
    if (!buyer_email || !buyer_name) {
      return res.status(400).json({ error: 'Buyer information missing' });
    }


    const buyer = await User.findById(req.user.userId);
const totalPayable = required_workers * payable_amount * 10;

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
    console.log('=== BUYER MY TASK DEBUG ===');
    console.log('User ID from token:', req.user.userId);
    
    // Check if user exists
    const buyer = await User.findById(req.user.userId);
    console.log('Buyer found:', buyer ? 'Yes' : 'No');
    console.log('Buyer email:', buyer?.email);
    
    // Count all tasks in database
    const allTasksCount = await Task.countDocuments();
    console.log('Total tasks in DB:', allTasksCount);
    
    // Count tasks for this buyer
    const buyerTasksCount = await Task.countDocuments({ buyer_id: req.user.userId });
    console.log('Tasks for this buyer:', buyerTasksCount);
    
    // Get tasks
    const tasks = await Task.find({ buyer_id: req.user.userId });
    console.log('Tasks found:', tasks.length);
    
    res.json({
      tasks,
      total: buyerTasksCount,
      pages: Math.ceil(buyerTasksCount / 10),
      currentPage: 1,
    });
  } catch (error) {
    console.error('Error:', error);
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
router.get('/top-workers', async (req, res) => {
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
