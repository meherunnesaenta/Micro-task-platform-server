const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema(
  {
    worker_email: { type: String, required: true },
    worker_name: { type: String, required: true },
    withdrawal_coin: { type: Number, required: true },
    withdrawal_amount: { type: Number, required: true },
    payment_system: {
      type: String,
      enum: ['stripe', 'bkash', 'rocket', 'nagad'],
      default: 'stripe',
    },
    account_number: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    withdraw_date: { type: Date, default: Date.now },
    processed_date: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Withdrawal', withdrawalSchema);
