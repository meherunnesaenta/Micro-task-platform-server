# Quick Start Guide - Micro-Task Platform Backend

## 🚀 Getting Started (5 minutes)

### Step 1: Configure Environment Variables
Update your `.env` file with your actual credentials:
```env
MONGODB_URI=mongodb+srv://your_username:your_password@your-cluster.mongodb.net/micro-task-platform?retryWrites=true&w=majority
JWT_SECRET=your_generated_secret_key_here
PORT=5000
NODE_ENV=development
```

**How to get MongoDB URI:**
1. Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create account → Create Cluster → Add IP address (0.0.0.0/0 for development)
3. Create Database User → Connect → Copy connection string
4. Replace `<password>` and `<username>`

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Install Dependencies
```bash
cd server
npm install
```

### Step 3: Start Development Server
```bash
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
🚀 Server is running on port 5000
📝 Environment: development
```

### Step 4: Test the Server
```bash
curl http://localhost:5000/api/health
```

Response:
```json
{"status":"OK","message":"Server is running"}
```

---

## 📋 Complete Feature Checklist

### Authentication ✅
- [x] User Registration with validation
- [x] User Login
- [x] JWT Token generation
- [x] Password hashing with bcryptjs
- [x] Role assignment on registration
- [x] Initial coins distribution (Worker: 10, Buyer: 50)

### Buyer Features ✅
- [x] Create Tasks
- [x] Edit Tasks
- [x] Delete Tasks with coin refund
- [x] View My Tasks
- [x] Review task submissions
- [x] Approve/Reject submissions
- [x] Purchase coins (4 packages available)
- [x] View payment history
- [x] Role-based access control

### Worker Features ✅
- [x] View all available tasks
- [x] Submit task work
- [x] View my submissions with pagination
- [x] View approved submissions (earnings)
- [x] Request withdrawal
- [x] View withdrawal history
- [x] Minimum coin requirement (200 coins = $10)
- [x] Role-based access control

### Admin Features ✅
- [x] Dashboard statistics
- [x] View all users
- [x] Update user roles
- [x] Delete users
- [x] View all tasks
- [x] Delete tasks
- [x] Manage withdrawal requests
- [x] Approve/Reject withdrawals

### Notification System ✅
- [x] Task submission notifications to buyer
- [x] Submission approval/rejection notifications to worker
- [x] Withdrawal notifications to admin
- [x] Withdrawal approval notifications to worker
- [x] Notification listing with pagination
- [x] Mark as read functionality
- [x] Unread count endpoint

### Business Logic ✅
- [x] Coin calculation for task creation
- [x] Coin deduction from buyer
- [x] Coin addition to worker on approval
- [x] Withdrawal calculation (20 coins = $1)
- [x] Task status updates
- [x] Required workers count management

---

## 🧪 Testing with Postman

### 1. Register Worker
```
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "John Worker",
  "email": "worker@example.com",
  "password": "Password123",
  "role": "worker",
  "photoURL": "https://i.pravatar.cc/150?img=1"
}
```

### 2. Register Buyer
```
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Jane Buyer",
  "email": "buyer@example.com",
  "password": "Password123",
  "role": "buyer",
  "photoURL": "https://i.pravatar.cc/150?img=2"
}
```

### 3. Buyer Creates Task
```
POST http://localhost:5000/api/tasks
Authorization: Bearer <buyer_token>
Content-Type: application/json

{
  "task_title": "Review my website",
  "task_detail": "Please review and provide suggestions for improvement",
  "required_workers": 5,
  "payable_amount": 10,
  "completion_date": "2024-02-15",
  "submission_info": "Submit your review as text or document",
  "task_image_url": "https://via.placeholder.com/300"
}
```

### 4. Worker Views Tasks
```
GET http://localhost:5000/api/tasks?page=1&limit=10
Authorization: Bearer <worker_token>
```

### 5. Worker Submits Task
```
POST http://localhost:5000/api/submissions
Authorization: Bearer <worker_token>
Content-Type: application/json

{
  "task_id": "507f1f77bcf86cd799439011",
  "submission_details": "Your website looks great! Here are my suggestions: 1. Improve mobile responsiveness 2. Add more CTAs"
}
```

### 6. Buyer Reviews Submissions
```
GET http://localhost:5000/api/submissions/buyer/review
Authorization: Bearer <buyer_token>
```

### 7. Buyer Approves Submission
```
PUT http://localhost:5000/api/submissions/607f1f77bcf86cd799439013/approve
Authorization: Bearer <buyer_token>
```

### 8. Worker Requests Withdrawal
```
POST http://localhost:5000/api/withdrawals
Authorization: Bearer <worker_token>
Content-Type: application/json

{
  "withdrawal_coin": 200,
  "payment_system": "stripe",
  "account_number": "acct_1234567890"
}
```

### 9. Buyer Purchases Coins
```
POST http://localhost:5000/api/payments/dummy-payment
Authorization: Bearer <buyer_token>
Content-Type: application/json

{
  "coins": 150
}
```

---

## 📊 API Response Examples

### Successful Task Submission
```json
{
  "message": "Submission created successfully",
  "submission": {
    "_id": "607f1f77bcf86cd799439013",
    "task_id": "507f1f77bcf86cd799439011",
    "task_title": "Review my website",
    "payable_amount": 10,
    "worker_email": "worker@example.com",
    "status": "pending",
    "submitted_date": "2024-01-20T15:30:00Z"
  }
}
```

### Error Response - Insufficient Coins
```json
{
  "error": "Not enough coins. Please purchase coins first.",
  "required": 500,
  "available": 50
}
```

---

## 🔧 Common Tasks

### Check Database Collections
Use MongoDB Atlas web UI or mongosh:
```bash
mongosh "mongodb+srv://username:password@cluster.mongodb.net/micro-task-platform"

# View collections
show collections

# Count documents
db.users.countDocuments()
db.tasks.countDocuments()

# Find worker users
db.users.find({role: "worker"})
```

### View Server Logs
```bash
npm run dev
# Look for console.log outputs from routes
```

### Debug Issues
1. Check if MongoDB is connected (look for ✅ MongoDB connected message)
2. Verify token is being sent in Authorization header
3. Check error messages in console
4. Verify .env file has correct values

---

## 📦 Project Structure
```
server/
├── index.js                 # Main server file
├── package.json             # Dependencies
├── .env                     # Environment variables (DO NOT COMMIT)
├── .env.example             # Example environment variables
├── middleware/
│   └── auth.js              # Authentication & authorization
├── models/
│   ├── User.js              # User schema
│   ├── Task.js              # Task schema
│   ├── Submission.js        # Submission schema
│   ├── Withdrawal.js        # Withdrawal schema
│   ├── Payment.js           # Payment schema
│   └── Notification.js      # Notification schema
├── routes/
│   ├── auth.js              # Auth endpoints
│   ├── tasks.js             # Task endpoints
│   ├── submissions.js       # Submission endpoints
│   ├── withdrawals.js       # Withdrawal endpoints
│   ├── payments.js          # Payment endpoints
│   ├── notifications.js     # Notification endpoints
│   └── admin.js             # Admin endpoints
├── BACKEND_SETUP.md         # Detailed setup guide
├── API_DOCUMENTATION.md     # Complete API reference
└── QUICK_START.md           # This file
```

---

## 🐛 Troubleshooting

### Issue: MongoDB Connection Failed
**Solution:**
- Verify connection string in .env
- Check if IP address is whitelisted in MongoDB Atlas
- Ensure database user exists and password is correct

### Issue: Invalid Token Error
**Solution:**
- Ensure token is sent in Authorization header: `Bearer <token>`
- Check if token has expired (7 days by default)
- Verify JWT_SECRET matches in .env

### Issue: CORS Error
**Solution:**
- CORS is already enabled for all origins in this setup
- For production, configure specific origins in index.js

### Issue: Port Already in Use
**Solution:**
```bash
# Change PORT in .env to different port (e.g., 5001)
# Or kill the existing process:
lsof -ti:5000 | xargs kill -9  # On Mac/Linux
netstat -ano | findstr :5000   # On Windows
```

---

## ✨ Performance Tips

1. **Optimize Database Queries**
   - Use `.select('-password')` to exclude passwords
   - Add indexes for frequently queried fields

2. **Implement Caching**
   - Cache top workers list
   - Cache coin package information

3. **Use Pagination**
   - Already implemented for all list endpoints
   - Reduces memory usage

4. **Monitor Performance**
   - Use MongoDB performance insights
   - Monitor response times with logging

---

## 🎯 Next: Frontend Integration

### Connect Your Frontend
Use these endpoints in your React client:
- Authentication: `/api/auth`
- Tasks: `/api/tasks`
- Submissions: `/api/submissions`
- Withdrawals: `/api/withdrawals`
- Payments: `/api/payments`
- Notifications: `/api/notifications`
- Admin: `/api/admin`

### Frontend .env Variables
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_JWT_STORAGE_KEY=mtp_token
```

### Store Token in Frontend
```javascript
// After login
localStorage.setItem('mtp_token', response.token);

// For API requests
const token = localStorage.getItem('mtp_token');
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

---

## 📞 Support Resources

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [JWT.io](https://jwt.io/)
- [RESTful API Design](https://restfulapi.net/)

---

## ✅ Deployment Checklist

Before deploying to production:
- [ ] Set NODE_ENV=production
- [ ] Use strong JWT_SECRET
- [ ] Enable HTTPS only
- [ ] Configure specific CORS origins
- [ ] Add request rate limiting
- [ ] Set up proper logging
- [ ] Add input sanitization
- [ ] Enable MongoDB backups
- [ ] Set environment variables on hosting platform
- [ ] Test all endpoints thoroughly
- [ ] Implement monitoring/alerting
- [ ] Add API documentation link to README

Happy Coding! 🎉
