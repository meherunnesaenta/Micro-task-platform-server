const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    toEmail: { type: String, required: true },
    message: { type: String, required: true },
    actionRoute: { type: String, default: '/dashboard' },
    type: {
      type: String,
      enum: ['approval', 'rejection', 'withdrawal', 'submission', 'task'],
      default: 'notification',
    },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
