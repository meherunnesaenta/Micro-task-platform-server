const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User');

// GET /api/public/tasks - Public route (no auth needed)
router.get('/public/tasks', async (req, res) => {
  try {
    const { page = 1, limit = 6 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const now = new Date();
    
    const tasks = await Task.find({
      status: 'active',
      required_workers: { $gt: 0 },
      completion_date: { $gte: now }
    })
    .select('task_title buyer_name payable_amount required_workers completion_date task_image_url task_detail')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

    const total = await Task.countDocuments({
      status: 'active',
      required_workers: { $gt: 0 },
      completion_date: { $gte: now }
    });

    res.status(200).json({
      success: true,
      tasks: tasks,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('Public tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks'
    });
  }
});

// GET /api/public/tasks/:id - Get single task
router.get('/public/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .select('task_title buyer_name payable_amount required_workers completion_date task_image_url task_detail submission_info');
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.status(200).json({
      success: true,
      task
    });
  } catch (error) {
    console.error('Public task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task'
    });
  }
});

router.get('/public/top-workers', async (req, res) => {
  try {
    const topWorkers = await User.find({ role: 'worker' })
      .sort('-coins')
      .limit(6)
      .select('name photoURL coins email role');

    res.status(200).json({
      success: true,
      workers: topWorkers
    });
  } catch (error) {
    console.error('Error fetching top workers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top workers'
    });
  }
});

module.exports = router;