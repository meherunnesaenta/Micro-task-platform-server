const mongoose = require('mongoose');


const taskSchema = new mongoose.Schema(
  {
    task_title: { type: String, required: true },
    task_detail: { type: String, required: true },
    required_workers: { type: Number, required: true },
    payable_amount: { type: Number, required: true },
    completion_date: { type: Date, required: true },
    submission_info: { type: String, required: true },
    task_image_url: { type: String },
    buyer_email: { type: String, required: true },
    buyer_name: { type: String, required: true },
    buyer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
