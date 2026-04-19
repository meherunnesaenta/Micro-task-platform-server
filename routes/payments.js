const express = require('express');
const router = express.Router();
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // uncomment with key
const stripe = null; // dummy mode
const Payment = require('../models/Payment');
const User = require('../models/User');
const { authMiddleware, authorize } = require('../middleware/auth');

// Coin packages matching spec: 10 coins = $1 etc.
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

// Client calls this for purchaseCoins
router.post('/purchase-coins', authMiddleware, authorize('buyer'), async (req, res) => {
  try {
    const { amount, coins, paymentMethodId } = req.body;

    console.log('Payment request:', { amount, coins, paymentMethodId });

    // Dummy success (no Stripe key needed)
    const buyer = await User.findById(req.user.userId);
    if (!buyer) return res.status(404).json({ error: 'User not found' });

    // Save payment record FIRST
    const payment = new Payment({
      buyer_email: buyer.email,
      buyer_name: buyer.name,
      coin_amount: parseInt(coins),
      price: parseFloat(amount),
      transaction_id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'completed',
      payment_method: 'card',
    });
    await payment.save();

    // Then add coins
    buyer.coins += parseInt(coins);
    await buyer.save();

    res.json({ 
      success: true,
      paymentId: payment._id,
      coinsAdded: parseInt(coins),
      newBalance: buyer.coins,
      message: 'Coins added successfully!'
    });

  } catch (error) {
    console.error('Purchase error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Stripe Webhook for payment succeeded
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test');
  } catch (err) {
    console.error(`Webhook signature failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const paymentId = paymentIntent.metadata.paymentId;
    const userId = paymentIntent.metadata.userId;
    const coins = parseInt(paymentIntent.metadata.coins);

    const payment = await Payment.findById(paymentId);
    if (payment && payment.status === 'pending') {
      payment.status = 'completed';
      payment.transaction_id = paymentIntent.id;
      await payment.save();

      const buyer = await User.findById(userId);
      if (buyer) {
        buyer.coins += coins;
        await buyer.save();
        console.log(`Added ${coins} coins to ${buyer.email}`);
      }
    }
  }

  res.json({received: true});
});

// Dummy payment for testing
router.post('/dummy-payment', authMiddleware, authorize('buyer'), async (req, res) => {
  try {
    const { coins } = req.body;
    const price = coinPackages[coins] || coins / 10;

    const buyer = await User.findById(req.user.userId);
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
      message: 'Dummy payment success',
      newBalance: buyer.coins,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payment history
router.get('/history', authMiddleware, authorize('buyer'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const buyer = await User.findById(req.user.userId);
    const payments = await Payment.find({ buyer_email: buyer.email })
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments({ buyer_email: buyer.email });
    const totalAmount = await Payment.aggregate([
      { $match: { buyer_email: buyer.email } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);

    res.json({
      payments,
      total: payments.length,
      totalAmount: totalAmount[0]?.total || 0,
      currentPage: page,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

