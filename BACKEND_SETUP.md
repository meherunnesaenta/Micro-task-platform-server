# Micro-Task Platform - Backend Setup Guide

## Environment Variables

Create a `.env` file in the server root directory with the following variables:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster-name.mongodb.net/micro-task-platform?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_this

# Server Configuration
PORT=5000
NODE_ENV=development
```

### How to get MongoDB credentials:
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account or log in
3. Create a new cluster
4. Go to "Database Users" and create a new user with a password
5. Go to "Clusters" > "Connect" and get your connection string
6. Replace `<password>` with your database user password and `<username>` with the username

### JWT_SECRET:
Generate a strong secret key. You can use:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Installation & Setup

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create .env file:**
   Create `.env` file with the variables mentioned above

4. **Start the server:**
   ```bash
   npm run dev
   ```
   The server will run on `http://localhost:5000`

## Available Scripts

- `npm start` - Start the server in production mode
- `npm run dev` - Start the server with nodemon for development (auto-reload on changes)

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register a new user
- `POST /login` - Login user
- `GET /me` - Get current user profile
- `PUT /profile` - Update user profile

### Tasks (`/api/tasks`)
- `GET /` - Get all available tasks
- `GET /:id` - Get task details
- `POST /` - Create a new task (Buyer only)
- `PUT /:id` - Update task (Buyer only)
- `DELETE /:id` - Delete task (Buyer only)

### Submissions (`/api/submissions`)
- `POST /` - Submit task work (Worker only)
- `GET /worker/my-submissions` - Get worker's submissions
- `GET /buyer/review` - Get submissions to review (Buyer only)
- `PUT /:id/approve` - Approve submission (Buyer only)
- `PUT /:id/reject` - Reject submission (Buyer only)

### Withdrawals (`/api/withdrawals`)
- `POST /` - Create withdrawal request (Worker only)
- `GET /worker/history` - Get worker's withdrawal history
- `GET /admin/pending` - Get pending withdrawals (Admin only)
- `PUT /:id/approve` - Approve withdrawal (Admin only)
- `PUT /:id/reject` - Reject withdrawal (Admin only)

### Payments (`/api/payments`)
- `GET /packages` - Get coin packages
- `POST /create-payment` - Create payment (Buyer only)
- `PUT /confirm/:paymentId` - Confirm payment (Buyer only)
- `POST /dummy-payment` - Dummy payment for testing
- `GET /history` - Get payment history (Buyer only)

### Notifications (`/api/notifications`)
- `GET /` - Get user notifications
- `GET /unread/count` - Get unread notification count
- `PUT /:id/read` - Mark notification as read
- `PUT /read-all` - Mark all notifications as read
- `DELETE /:id` - Delete notification

### Admin (`/api/admin`)
- `GET /stats` - Get dashboard statistics
- `GET /users` - Get all users
- `PUT /users/:id/role` - Update user role
- `DELETE /users/:id` - Delete user
- `GET /tasks` - Get all tasks
- `DELETE /tasks/:id` - Delete task

## Database Collections

### User
- `name` - User name
- `email` - User email (unique)
- `password` - Hashed password
- `photoURL` - Profile photo URL
- `role` - User role (worker/buyer/admin)
- `coins` - Available coins
- `createdAt` - Account creation date

### Task
- `task_title` - Task title
- `task_detail` - Task description
- `required_workers` - Number of workers needed
- `payable_amount` - Amount per worker
- `completion_date` - Task deadline
- `submission_info` - What to submit
- `task_image_url` - Task image
- `buyer_email` - Buyer's email
- `buyer_name` - Buyer's name
- `status` - Task status (active/completed/cancelled)

### Submission
- `task_id` - Reference to task
- `worker_email` - Worker's email
- `worker_name` - Worker's name
- `submission_details` - Submission content
- `buyer_email` - Buyer's email
- `status` - Submission status (pending/approved/rejected)
- `submitted_date` - Submission date

### Withdrawal
- `worker_email` - Worker's email
- `withdrawal_coin` - Coins to withdraw
- `withdrawal_amount` - Dollar amount
- `payment_system` - Payment method
- `account_number` - Account details
- `status` - Withdrawal status (pending/approved/rejected)

### Payment
- `buyer_email` - Buyer's email
- `coin_amount` - Coins purchased
- `price` - Price in dollars
- `transaction_id` - Payment transaction ID
- `status` - Payment status (pending/completed/failed)

### Notification
- `toEmail` - Recipient email
- `message` - Notification message
- `actionRoute` - Route to navigate
- `type` - Notification type
- `isRead` - Read status

## Authentication Flow

1. User registers or logs in
2. Server returns JWT token
3. Client stores token in localStorage
4. For protected routes, client sends token in `Authorization: Bearer <token>` header
5. Server verifies token and processes request

## Role-Based Access

- **Worker**: Can view tasks, submit tasks, view their submissions, make withdrawals
- **Buyer**: Can create tasks, review submissions, purchase coins
- **Admin**: Can manage users, manage tasks, manage withdrawals, view statistics

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

## Testing the API

You can test the API using:
- [Postman](https://www.postman.com/) - API testing tool
- [Insomnia](https://insomnia.rest/) - Alternative REST client
- cURL commands in terminal

### Example: Register a user
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password123",
    "role": "worker",
    "photoURL": "https://example.com/photo.jpg"
  }'
```

## Coin System

- **Worker Registration**: 10 coins
- **Buyer Registration**: 50 coins
- **Coin Purchase**: 10 coins = $1, 150 coins = $10, 500 coins = $20, 1000 coins = $35
- **Withdrawal**: 20 coins = $1 (minimum 200 coins = $10)
- **Profit Margin**: Platform keeps 50% (buy at 10:1, withdraw at 20:1)

## Important Notes

1. Always hash passwords before storing
2. Validate all user inputs
3. Check user roles before sensitive operations
4. Handle MongoDB errors gracefully
5. Implement rate limiting for production
6. Use HTTPS in production
7. Keep JWT_SECRET secure
8. Implement proper logging

## Troubleshooting

**MongoDB Connection Error:**
- Check if connection string is correct
- Verify IP address is whitelisted in MongoDB Atlas
- Check credentials

**JWT Errors:**
- Ensure JWT_SECRET is set in .env
- Check token format in Authorization header
- Verify token hasn't expired

**CORS Issues:**
- Check if client URL is allowed in CORS
- Verify request headers are correct

## Support & Documentation

For more information about the technologies used:
- [Express.js](https://expressjs.com/)
- [MongoDB](https://docs.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)
- [JWT](https://jwt.io/)
