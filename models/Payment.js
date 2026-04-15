const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    buyer_email: { type: String, required: true },
    buyer_name: { type: String, required: true },
    coin_amount: { type: Number, required: true },
    price: { type: Number, required: true },
    payment_method: { type: String, default: 'stripe' },
    transaction_id: { type: String },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    payment_date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
