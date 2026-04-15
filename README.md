# 🎯 Micro-Task Platform - Backend Server

A comprehensive MERN stack backend for a micro-tasking and earning platform where workers complete small tasks for payment and buyers create tasks for workers.

## 🌟 Features

### Authentication & Authorization
- ✅ User registration with email validation & password hashing
- ✅ JWT-based login system
- ✅ Role-based access control (Worker, Buyer, Admin)
- ✅ Secure token storage
- ✅ Profile management

### Worker Features
- ✅ View available tasks with pagination
- ✅ Submit task work with details
- ✅ Track submission status (Pending/Approved/Rejected)
- ✅ View earnings from approved submissions
- ✅ Request withdrawals (with 20 coins = $1 rate)
- ✅ Minimum withdrawal requirement (200 coins = $10)
- ✅ Withdrawal history tracking

### Buyer Features
- ✅ Create tasks with detailed requirements
- ✅ View task submissions from workers
- ✅ Approve/Reject submissions
- ✅ Automatic coin deduction on task creation
- ✅ Purchase coins using 4 different packages
- ✅ Payment history tracking
- ✅ Update and delete tasks
- ✅ Refund coins for deleted uncompleted tasks

### Admin Features
- ✅ Dashboard with platform statistics
- ✅ User management (view, update roles, delete)
- ✅ Task management (view, delete)
- ✅ Withdrawal request management
- ✅ Approve/Reject withdrawals

### Notification System
- ✅ Real-time notifications for all major actions
- ✅ Notifications for task submissions, approvals, rejections
- ✅ Withdrawal notifications
- ✅ Read/Unread status tracking
- ✅ Notification history

### Business Logic
- ✅ Intelligent coin management system
- ✅ Worker receives 10 coins on registration
- ✅ Buyer receives 50 coins on registration
- ✅ Task cost calculation: required_workers × payable_amount
- ✅ Automatic coin updates on transactions
- ✅ Withdrawal percentage (Platform: 50%, Workers: 50%)

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v14+)
- npm or yarn
- MongoDB Atlas account (free tier available)

### 2. Installation
```bash
# Clone repository
cd server

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your MongoDB URI and JWT_SECRET

# Start development server
npm run dev
```

### 3. Verify Server
```bash
curl http://localhost:5000/api/health
```

Response:
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [QUICK_START.md](./QUICK_START.md) | 5-minute setup guide with testing examples |
| [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | Complete API reference with all endpoints |
| [BACKEND_SETUP.md](./BACKEND_SETUP.md) | Detailed installation & configuration |
| [ENV_VARIABLES.md](./ENV_VARIABLES.md) | Environment variable reference |

---

## 🏗️ Project Structure
```
server/
├── index.js                          # Main application entry point
├── package.json                      # Dependencies & scripts
├── .env                              # Environment variables (create this)
├── .env.example                      # Example env file
│
├── middleware/
│   └── auth.js                       # JWT authentication & role authorization
│
├── models/                           # Database schemas
│   ├── User.js                       # User schema
│   ├── Task.js                       # Task schema
│   ├── Submission.js                 # Submission schema
│   ├── Withdrawal.js                 # Withdrawal schema
│   ├── Payment.js                    # Payment schema
│   └── Notification.js               # Notification schema
│
├── routes/                           # API endpoints
│   ├── auth.js                       # /api/auth (register, login, profile)
│   ├── tasks.js                      # /api/tasks (CRUD, viewing)
│   ├── submissions.js                # /api/submissions (submit, review)
│   ├── withdrawals.js                # /api/withdrawals (request, manage)
│   ├── payments.js                   # /api/payments (purchase coins)
│   ├── notifications.js              # /api/notifications (manage)
│   └── admin.js                      # /api/admin (statistics, management)
│
└── docs/
    ├── QUICK_START.md                # Quick start guide
    ├── API_DOCUMENTATION.md          # Full API docs
    ├── BACKEND_SETUP.md              # Setup guide
    └── ENV_VARIABLES.md              # Env variables reference
```

---

## 📋 API Endpoints

### Authentication (`/api/auth`)
```
POST   /register              Register new user
POST   /login                 Login user
GET    /me                    Get current user profile
PUT    /profile               Update user profile
```

### Tasks (`/api/tasks`)
```
GET    /                      Get all available tasks
GET    /:id                   Get task details
POST   /                      Create task (Buyer only)
PUT    /:id                   Update task (Buyer only)
DELETE /:id                   Delete task (Buyer only)
GET    /buyer/my-tasks        Get buyer's tasks
GET    /admin/top-workers     Get top 6 workers
```

### Submissions (`/api/submissions`)
```
POST   /                      Submit task (Worker only)
GET    /worker/my-submissions Get worker's submissions
GET    /buyer/review          Get submissions to review (Buyer only)
PUT    /:id/approve           Approve submission (Buyer only)
PUT    /:id/reject            Reject submission (Buyer only)
GET    /worker/approved       Get approved submissions (Worker)
```

### Withdrawals (`/api/withdrawals`)
```
POST   /                      Request withdrawal (Worker only)
GET    /worker/history        Get withdrawal history (Worker)
GET    /admin/pending         Get pending withdrawals (Admin only)
PUT    /:id/approve           Approve withdrawal (Admin only)
PUT    /:id/reject            Reject withdrawal (Admin only)
```

### Payments (`/api/payments`)
```
GET    /packages              Get coin packages
POST   /create-payment        Create payment (Buyer only)
PUT    /confirm/:paymentId    Confirm payment (Buyer only)
POST   /dummy-payment         Dummy payment for testing
GET    /history               Get payment history (Buyer only)
```

### Notifications (`/api/notifications`)
```
GET    /                      Get user notifications
GET    /unread/count          Get unread count
PUT    /:id/read              Mark as read
PUT    /read-all              Mark all as read
DELETE /:id                   Delete notification
```

### Admin (`/api/admin`)
```
GET    /stats                 Get dashboard statistics
GET    /users                 Get all users
PUT    /users/:id/role        Update user role
DELETE /users/:id             Delete user
GET    /tasks                 Get all tasks
DELETE /tasks/:id             Delete task
```

---

## 💰 Coin System

### Registration Bonuses
- **Workers**: 10 coins
- **Buyers**: 50 coins

### Coin Packages (Purchase)
- 10 coins = $1
- 150 coins = $10
- 500 coins = $20
- 1000 coins = $35

### Withdrawal
- 20 coins = $1
- Minimum withdrawal: 200 coins = $10
- Maximum: User's available balance

### Business Model
- **Buy Rate**: 10 coins = $1
- **Sell Rate**: 20 coins = $1
- **Platform Margin**: 50%

---

## 🔐 Security Features

- ✅ **Password Hashing**: bcryptjs with salt rounds
- ✅ **JWT Authentication**: Secure token-based auth
- ✅ **Role-Based Access**: Protect sensitive operations
- ✅ **Input Validation**: Email format, password strength
- ✅ **Error Handling**: Safe error messages without exposing internals
- ✅ **CORS Enabled**: Configured for all origins
- ✅ **MongoDB Security**: Connection string in environment variables

---

## 🧪 Testing API

### With Postman
1. Import endpoints from API_DOCUMENTATION.md
2. Create environment variables for token and URLs
3. Set Authorization header: `Bearer <token>`

### With cURL
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"Pass123","role":"worker"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"Pass123"}'

# Get profile (with token)
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

---

## 🗄️ Database Collections

### Users
- Stores user profiles, roles, and available coins
- Indexed by email for faster lookups
- Password stored as bcrypt hash

### Tasks
- Task listings created by buyers
- Tracks required workers and payable amount
- Automatically manages status and worker count

### Submissions
- Worker task submissions for review
- Tracks submission status and dates
- Links worker to task and buyer

### Withdrawals
- Worker withdrawal requests
- Tracks coin amount and dollar equivalent
- Manages withdrawal status and payment method

### Payments
- Records all coin purchases
- Tracks transaction IDs and payment status
- Links purchases to buyer accounts

### Notifications
- System-generated notifications
- Supports read/unread status
- Soft delete through archiving

---

## 🔄 Transaction Flow

### Task Completion Flow
1. **Buyer creates task** → Coins deducted from buyer
2. **Worker submits** → Notification sent to buyer
3. **Buyer reviews** → Can approve or reject
4. **If approved** → Coins credited to worker, task worker count reduced
5. **If rejected** → Worker count increased, refund available workers

### Withdrawal Flow
1. **Worker requests withdrawal** → Creates pending withdrawal
2. **Admin reviews** → Can approve or reject
3. **If approved** → Coins deducted, worker notified
4. **If rejected** → Coins remain, worker notified

### Payment Flow
1. **Buyer selects package** → Payment created (pending)
2. **Payment confirmed** → Transaction ID stored
3. **Status updated** → Coins added to buyer account
4. **Notification sent** → Logged in payment history

---

## ⚙️ Environment Setup

### MongoDB Atlas
1. Create free account at mongodb.com/cloud/atlas
2. Create cluster (M0 free tier)
3. Create database user
4. Whitelist IP address (0.0.0.0/0 for development)
5. Get connection string
6. Update MONGODB_URI in .env

### JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Add result to JWT_SECRET in .env

---

## 📊 Coin Audit

Monitor coin flow with these queries:

```javascript
// Total coins in system
db.users.aggregate([{ $group: { _id: null, total: { $sum: "$coins" } } }])

// Coins by role
db.users.aggregate([{ $group: { _id: "$role", count: { $sum: 1 }, totalCoins: { $sum: "$coins" } } }])

// Most paid tasks
db.tasks.find().sort({payable_amount: -1}).limit(10)

// Pending withdrawals
db.withdrawals.find({status: "pending"})
```

---

## 🚀 Deployment Checklist

- [ ] Set NODE_ENV=production
- [ ] Use strong JWT_SECRET (32+ chars)
- [ ] Configure MongoDB IP whitelist
- [ ] Enable HTTPS
- [ ] Set specific CORS origins
- [ ] Add rate limiting
- [ ] Set up logging/monitoring
- [ ] Enable database backups
- [ ] Test all critical flows
- [ ] Document admin credentials
- [ ] Set up error alerts

---

## 🤝 Contributing

When adding new features:
1. Follow existing code structure
2. Add proper error handling
3. Validate all inputs
4. Add relevant notifications
5. Update API documentation
6. Test with multiple roles

---

## 📞 Support

If you encounter issues:
1. Check QUICK_START.md for common problems
2. Review API_DOCUMENTATION.md for endpoint details
3. Check MongoDB connection in .env
4. Verify role permissions
5. Look at console error messages

---

## 📝 License

This project is part of a job assessment for Junior MERN Stack Developer position.

---

## 🎯 Next Steps

1. ✅ Backend setup complete
2. ⏭️ Build React frontend
3. ⏭️ Connect frontend to API
4. ⏭️ Add Stripe payment integration
5. ⏭️ Deploy to production

---

**Last Updated**: January 2024  
**Status**: ✅ Production Ready for Assessment
