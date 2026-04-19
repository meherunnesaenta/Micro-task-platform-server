const express = require('express');
const router = express.Router();
const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authMiddleware, authorize } = require('../middleware/auth');

// Create withdrawal request (Worker)
// Create withdrawal request (Worker)
router.post('/', authMiddleware, authorize('worker'), async (req, res) => {
  try {
    console.log('Withdraw body:', req.body);

    // ✅ Better parsing
    let withdrawal_coin = parseInt(req.body.withdrawal_coin);
    const payment_system = req.body.payment_system;
    const account_number = req.body.account_number;

    // ✅ Check if parsing worked
    if (isNaN(withdrawal_coin)) {
      return res.status(400).json({ error: 'Invalid coin amount', received: req.body.withdrawal_coin });
    }

    console.log('Parsed withdrawal_coin:', withdrawal_coin);
    console.log('Type:', typeof withdrawal_coin);

    if (!payment_system || !account_number) {
      return res.status(400).json({ error: 'All fields are required', received: req.body });
    }

    // Minimum 200 coins for withdrawal
    if (withdrawal_coin < 200) {
      return res.status(400).json({
        error: `Minimum 200 coins required for withdrawal. You requested ${withdrawal_coin} coins`,
        minRequired: 200,
        requested: withdrawal_coin
      });
    }

    const worker = await User.findById(req.user.userId);
    console.log('Worker coins:', worker.coins);
    console.log('Requested withdrawal:', withdrawal_coin);

    // Check if worker has enough coins
    if (worker.coins < withdrawal_coin) {
      return res.status(400).json({
        error: 'Insufficient coins',
        available: worker.coins,
        required: withdrawal_coin,
      });
    }

    // Calculate withdrawal amount (20 coins = 1 dollar)
    const withdrawal_amount = withdrawal_coin / 20;
    console.log('Withdrawal amount in USD:', withdrawal_amount);

    // Deduct coins from worker
    worker.coins -= withdrawal_coin;
    await worker.save();
    console.log('Worker new balance:', worker.coins);

    const withdrawal = new Withdrawal({
      worker_email: worker.email,
      worker_name: worker.name,
      withdrawal_coin,
      withdrawal_amount,
      payment_system,
      account_number,
      status: 'pending',
    });

    await withdrawal.save();

    res.status(201).json({
      message: 'Withdrawal requested, coins deducted. Admin approval pending.',
      withdrawal,
      remainingCoins: worker.coins,
    });
  } catch (error) {
    console.error('Withdraw error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get worker's withdrawal history
router.get('/worker/history', authMiddleware, authorize('worker'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const worker = await User.findById(req.user.userId);
    const withdrawals = await Withdrawal.find({ worker_email: worker.email })
      .sort('-withdraw_date')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Withdrawal.countDocuments({ worker_email: worker.email });

    res.json({
      withdrawals,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all pending withdrawals (Admin)
router.get('/pending', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const withdrawals = await Withdrawal.find({ status: 'pending' })
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
    res.status(500).json({ error: error.message });
  }
});

// Approve withdrawal (Admin)
router.put('/:id/approve', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);

    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ error: 'Withdrawal already processed' });
    }

    withdrawal.status = 'approved';
    withdrawal.processed_date = new Date();
    await withdrawal.save();

    // Deduct coins from worker
    const worker = await User.findOne({ email: withdrawal.worker_email });
    worker.coins -= withdrawal.withdrawal_coin;
    await worker.save();

    // Create notification for worker
    const notification = new Notification({
      toEmail: withdrawal.worker_email,
      message: `Your withdrawal request of ${withdrawal.withdrawal_amount}$ (${withdrawal.withdrawal_coin} coins) has been approved!`,
      actionRoute: '/dashboard/worker-withdrawals',
      type: 'withdrawal',
    });

    await notification.save();

    res.json({
      message: 'Withdrawal approved',
      withdrawal,
      workerNewBalance: worker.coins,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reject withdrawal (Admin)
router.put('/:id/reject', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);

    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    withdrawal.status = 'rejected';
    await withdrawal.save();

    // Create notification for worker
    const notification = new Notification({
      toEmail: withdrawal.worker_email,
      message: `Your withdrawal request has been rejected. Please contact support for more information.`,
      actionRoute: '/dashboard/worker-withdrawals',
      type: 'withdrawal',
    });

    await notification.save();

    res.json({
      message: 'Withdrawal rejected',
      withdrawal,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
