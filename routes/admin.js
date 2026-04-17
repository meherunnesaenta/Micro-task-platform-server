const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Task = require('../models/Task');
const Submission = require('../models/Submission');
const Withdrawal = require('../models/Withdrawal');
const Payment = require('../models/Payment');
const { authMiddleware, authorize } = require('../middleware/auth');

// Get dashboard stats (Admin)
router.get('/stats', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const totalWorkers = await User.countDocuments({ role: 'worker' });
    const totalBuyers = await User.countDocuments({ role: 'buyer' });
    const totalCoins = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$coins' } } }
    ]);
    const totalPayments = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$price' } } },
    ]);

    res.json({
      totalWorkers,
      totalBuyers,
      totalAdmins: 1, // Usually single admin
      totalCoins: totalCoins[0]?.total || 0,
      totalPayments: totalPayments[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get top workers for home page
router.get('/top-workers', authMiddleware, async (req, res) => {
  try {
    const topWorkers = await User.find({ role: 'worker' })
      .sort('-coins')
      .limit(6)
      .select('name photoURL coins');
    res.json(topWorkers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users (Admin)
router.get('/users', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, role } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user role (Admin)
router.put('/users/:id/role', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.body;

    const validRoles = ['worker', 'buyer', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select(
      '-password'
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User role updated', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user (Admin)
router.delete('/users/:id', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete related data
    await Task.deleteMany({ buyer_email: user.email });
    await Submission.deleteMany({ worker_email: user.email });
    await Withdrawal.deleteMany({ worker_email: user.email });
    await Payment.deleteMany({ buyer_email: user.email });

    res.json({ message: 'User and related data deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all tasks (Admin)
router.get('/tasks', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const tasks = await Task.find()
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments();

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

// Delete task (Admin)
router.delete('/tasks/:id', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Refund coins to buyer
    const buyer = await User.findOne({ email: task.buyer_email });
    if (buyer) {
      const refundAmount = task.required_workers * task.payable_amount;
      buyer.coins += refundAmount;
      await buyer.save();
    }

    // Delete related submissions
    await Submission.deleteMany({ task_id: task._id });

    await Task.findByIdAndDelete(req.params.id);

    res.json({ message: 'Task deleted and coins refunded to buyer' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get admin withdrawals
router.get('/withdrawals', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const withdrawals = await Withdrawal.find({ status: 'pending' })
      .populate('worker_id', 'name email photoURL') // Fixed populate worker_id from model
      .sort('-withdraw_date')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Withdrawal.countDocuments({ status: 'pending' });

    res.json({
      withdrawals,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error('Admin withdrawals error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Approve withdrawal
router.put('/withdrawals/:id/approve', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal || withdrawal.status !== 'pending') {
      return res.status(400).json({ error: 'Invalid withdrawal' });
    }

    withdrawal.status = 'approved';
    withdrawal.processed_date = new Date();
    await withdrawal.save();

    // Notify worker
    const notification = new Notification({
      toEmail: withdrawal.worker_email,
      message: `Your withdrawal of $${withdrawal.withdrawal_amount} has been approved and processed!`,
      actionRoute: '/dashboard/worker-home',
    });
    await notification.save();

    res.json({ message: 'Withdrawal approved successfully', withdrawal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
