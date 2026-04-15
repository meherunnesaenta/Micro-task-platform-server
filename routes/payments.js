const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const User = require('../models/User');
const { authMiddleware, authorize } = require('../middleware/auth');

// Coin packages
const coinPackages = {
  '10': 1,
  '150': 10,
  '500': 20,
  '1000': 35,
};

// Get coin packages
router.get('/packages', (req, res) => {
  try {
    const packages = Object.entries(coinPackages).map(([coins, price]) => ({
      coins: parseInt(coins),
      price,
    }));
    res.json(packages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create payment intent for Stripe (Buyer)
router.post('/create-payment', authMiddleware, authorize('buyer'), async (req, res) => {
  try {
    const { coins } = req.body;

    if (!coins || !coinPackages[coins]) {
      return res.status(400).json({ error: 'Invalid coin package' });
    }

    const price = coinPackages[coins];
    const buyer = await User.findById(req.user.userId);

    const payment = new Payment({
      buyer_email: buyer.email,
      buyer_name: buyer.name,
      coin_amount: coins,
      price,
      status: 'pending',
    });

    await payment.save();

    // In a real scenario, this would integrate with Stripe API
    // For now, we'll return payment details for the client to handle
    res.status(201).json({
      message: 'Payment object created',
      payment: {
        _id: payment._id,
        coin_amount: payment.coin_amount,
        price: payment.price,
        currency: 'USD',
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Confirm payment (webhook or client callback)
router.put('/confirm/:paymentId', authMiddleware, authorize('buyer'), async (req, res) => {
  try {
    const { transactionId } = req.body;

    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID required' });
    }

    const payment = await Payment.findById(req.params.paymentId);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.buyer_email !== req.user.email) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    payment.status = 'completed';
    payment.transaction_id = transactionId;
    payment.payment_date = new Date();
    await payment.save();

    // Add coins to buyer
    const buyer = await User.findById(req.user.userId);
    buyer.coins += payment.coin_amount;
    await buyer.save();

    res.json({
      message: 'Payment completed successfully',
      payment,
      newBalance: buyer.coins,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dummy payment endpoint (for testing without Stripe)
router.post('/dummy-payment', authMiddleware, authorize('buyer'), async (req, res) => {
  try {
    const { coins } = req.body;

    if (!coins || !coinPackages[coins]) {
      return res.status(400).json({ error: 'Invalid coin package' });
    }

    const buyer = await User.findById(req.user.userId);
    const price = coinPackages[coins];

    const payment = new Payment({
      buyer_email: buyer.email,
      buyer_name: buyer.name,
      coin_amount: coins,
      price,
      transaction_id: `dummy_${Date.now()}`,
      status: 'completed',
    });

    await payment.save();

    buyer.coins += coins;
    await buyer.save();

    res.json({
      message: 'Payment completed successfully',
      payment,
      newBalance: buyer.coins,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payment history (Buyer)
router.get('/history', authMiddleware, authorize('buyer'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const buyer = await User.findById(req.user.userId);
    const payments = await Payment.find({ buyer_email: buyer.email })
      .sort('-payment_date')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments({ buyer_email: buyer.email });

    res.json({
      payments,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
