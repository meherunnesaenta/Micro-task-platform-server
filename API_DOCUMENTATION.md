# Micro-Task Platform - API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 1. AUTHENTICATION ENDPOINTS

### Register User
- **URL:** `/auth/register`
- **Method:** POST
- **Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123",
  "role": "worker",
  "photoURL": "https://example.com/photo.jpg"
}
```
- **Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "worker",
    "coins": 10,
    "photoURL": "https://example.com/photo.jpg"
  }
}
```

### Login User
- **URL:** `/auth/login`
- **Method:** POST
- **Body:**
```json
{
  "email": "john@example.com",
  "password": "Password123"
}
```
- **Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "worker",
    "coins": 10,
    "photoURL": "https://example.com/photo.jpg"
  }
}
```

### Get Current User Profile
- **URL:** `/auth/me`
- **Method:** GET
- **Auth Required:** Yes
- **Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "worker",
  "coins": 10,
  "photoURL": "https://example.com/photo.jpg",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Update User Profile
- **URL:** `/auth/profile`
- **Method:** PUT
- **Auth Required:** Yes
- **Body:**
```json
{
  "name": "Jane Doe",
  "photoURL": "https://example.com/new-photo.jpg"
}
```
- **Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Jane Doe",
  "email": "john@example.com",
  "role": "worker",
  "coins": 10,
  "photoURL": "https://example.com/new-photo.jpg"
}
```

---

## 2. TASK ENDPOINTS

### Get All Available Tasks
- **URL:** `/tasks`
- **Method:** GET
- **Query Parameters:**
  - `page` (default: 1)
  - `limit` (default: 10)
  - `sortBy` (default: -createdAt)
- **Response (200):**
```json
{
  "tasks": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "task_title": "Review my article",
      "task_detail": "Please review and provide feedback",
      "required_workers": 5,
      "payable_amount": 10,
      "completion_date": "2024-02-01T00:00:00Z",
      "submission_info": "Submit your feedback as text",
      "task_image_url": "https://example.com/task.jpg",
      "buyer_email": "buyer@example.com",
      "buyer_name": "Buyer Name",
      "status": "active"
    }
  ],
  "total": 50,
  "pages": 5,
  "currentPage": 1
}
```

### Get Task Details
- **URL:** `/tasks/:id`
- **Method:** GET
- **Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "task_title": "Review my article",
  "task_detail": "Please review and provide feedback",
  "required_workers": 5,
  "payable_amount": 10,
  "completion_date": "2024-02-01T00:00:00Z",
  "submission_info": "Submit your feedback as text",
  "task_image_url": "https://example.com/task.jpg",
  "buyer_email": "buyer@example.com",
  "buyer_name": "Buyer Name",
  "status": "active"
}
```

### Create Task (Buyer Only)
- **URL:** `/tasks`
- **Method:** POST
- **Auth Required:** Yes (Buyer)
- **Body:**
```json
{
  "task_title": "Write product description",
  "task_detail": "Write a 500 word product description",
  "required_workers": 10,
  "payable_amount": 20,
  "completion_date": "2024-02-01",
  "submission_info": "Submit as PDF or Word document",
  "task_image_url": "https://example.com/product.jpg"
}
```
- **Response (201):**
```json
{
  "message": "Task created successfully",
  "task": {
    "_id": "507f1f77bcf86cd799439012",
    "task_title": "Write product description",
    "task_detail": "Write a 500 word product description",
    "required_workers": 10,
    "payable_amount": 20,
    "completion_date": "2024-02-01T00:00:00Z",
    "submission_info": "Submit as PDF or Word document",
    "task_image_url": "https://example.com/product.jpg",
    "buyer_email": "buyer@example.com",
    "buyer_name": "Buyer Name",
    "status": "active"
  },
  "remainingCoins": 700
}
```

### Get Buyer's Tasks
- **URL:** `/tasks/buyer/my-tasks`
- **Method:** GET
- **Auth Required:** Yes (Buyer)
- **Query Parameters:**
  - `page` (default: 1)
  - `limit` (default: 10)
- **Response (200):**
```json
{
  "tasks": [...],
  "total": 25,
  "pages": 3,
  "currentPage": 1
}
```

### Update Task (Buyer Only)
- **URL:** `/tasks/:id`
- **Method:** PUT
- **Auth Required:** Yes (Buyer)
- **Body:**
```json
{
  "task_title": "Updated title",
  "task_detail": "Updated description",
  "submission_info": "Updated submission info"
}
```
- **Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "task_title": "Updated title",
  "task_detail": "Updated description",
  "submission_info": "Updated submission info"
}
```

### Delete Task (Buyer Only)
- **URL:** `/tasks/:id`
- **Method:** DELETE
- **Auth Required:** Yes (Buyer)
- **Response (200):**
```json
{
  "message": "Task deleted and coins refunded",
  "refundedAmount": 200
}
```

---

## 3. SUBMISSION ENDPOINTS

### Submit Task (Worker Only)
- **URL:** `/submissions`
- **Method:** POST
- **Auth Required:** Yes (Worker)
- **Body:**
```json
{
  "task_id": "507f1f77bcf86cd799439011",
  "submission_details": "Here is my completed work..."
}
```
- **Response (201):**
```json
{
  "message": "Submission created successfully",
  "submission": {
    "_id": "607f1f77bcf86cd799439013",
    "task_id": "507f1f77bcf86cd799439011",
    "task_title": "Review my article",
    "payable_amount": 10,
    "worker_email": "worker@example.com",
    "worker_name": "Worker Name",
    "submission_details": "Here is my completed work...",
    "buyer_email": "buyer@example.com",
    "buyer_name": "Buyer Name",
    "status": "pending",
    "submitted_date": "2024-01-20T15:30:00Z"
  }
}
```

### Get Worker's Submissions
- **URL:** `/submissions/worker/my-submissions`
- **Method:** GET
- **Auth Required:** Yes (Worker)
- **Query Parameters:**
  - `page` (default: 1)
  - `limit` (default: 10)
- **Response (200):**
```json
{
  "submissions": [...],
  "total": 15,
  "pages": 2,
  "currentPage": 1
}
```

### Get Submissions for Review (Buyer Only)
- **URL:** `/submissions/buyer/review`
- **Method:** GET
- **Auth Required:** Yes (Buyer)
- **Query Parameters:**
  - `page` (default: 1)
  - `limit` (default: 10)
- **Response (200):**
```json
{
  "submissions": [
    {
      "_id": "607f1f77bcf86cd799439013",
      "task_title": "Review my article",
      "worker_name": "Worker Name",
      "payable_amount": 10,
      "submission_details": "Here is my completed work...",
      "status": "pending"
    }
  ],
  "total": 5,
  "pages": 1,
  "currentPage": 1
}
```

### Approve Submission (Buyer Only)
- **URL:** `/submissions/:id/approve`
- **Method:** PUT
- **Auth Required:** Yes (Buyer)
- **Response (200):**
```json
{
  "message": "Submission approved",
  "submission": {
    "_id": "607f1f77bcf86cd799439013",
    "status": "approved",
    "reviewed_date": "2024-01-20T16:00:00Z"
  },
  "workerNewBalance": 110
}
```

### Reject Submission (Buyer Only)
- **URL:** `/submissions/:id/reject`
- **Method:** PUT
- **Auth Required:** Yes (Buyer)
- **Response (200):**
```json
{
  "message": "Submission rejected",
  "submission": {
    "_id": "607f1f77bcf86cd799439013",
    "status": "rejected",
    "reviewed_date": "2024-01-20T16:00:00Z"
  }
}
```

### Get Approved Submissions (Worker Earnings)
- **URL:** `/submissions/worker/approved`
- **Method:** GET
- **Auth Required:** Yes (Worker)
- **Response (200):**
```json
{
  "approvedSubmissions": [
    {
      "_id": "607f1f77bcf86cd799439013",
      "task_title": "Review my article",
      "payable_amount": 10,
      "buyer_name": "Buyer Name",
      "status": "approved"
    }
  ],
  "totalEarnings": 150
}
```

---

## 4. WITHDRAWAL ENDPOINTS

### Create Withdrawal Request (Worker Only)
- **URL:** `/withdrawals`
- **Method:** POST
- **Auth Required:** Yes (Worker)
- **Body:**
```json
{
  "withdrawal_coin": 200,
  "payment_system": "stripe",
  "account_number": "acc_1234567890"
}
```
- **Response (201):**
```json
{
  "message": "Withdrawal request submitted",
  "withdrawal": {
    "_id": "707f1f77bcf86cd799439014",
    "worker_email": "worker@example.com",
    "worker_name": "Worker Name",
    "withdrawal_coin": 200,
    "withdrawal_amount": 10,
    "payment_system": "stripe",
    "account_number": "acc_1234567890",
    "status": "pending",
    "withdraw_date": "2024-01-20T17:00:00Z"
  }
}
```

### Get Worker Withdrawal History
- **URL:** `/withdrawals/worker/history`
- **Method:** GET
- **Auth Required:** Yes (Worker)
- **Query Parameters:**
  - `page` (default: 1)
  - `limit` (default: 10)
- **Response (200):**
```json
{
  "withdrawals": [...],
  "total": 5,
  "pages": 1,
  "currentPage": 1
}
```

### Get Pending Withdrawals (Admin Only)
- **URL:** `/withdrawals/admin/pending`
- **Method:** GET
- **Auth Required:** Yes (Admin)
- **Query Parameters:**
  - `page` (default: 1)
  - `limit` (default: 10)
- **Response (200):**
```json
{
  "withdrawals": [...],
  "total": 25,
  "pages": 3,
  "currentPage": 1
}
```

### Approve Withdrawal (Admin Only)
- **URL:** `/withdrawals/:id/approve`
- **Method:** PUT
- **Auth Required:** Yes (Admin)
- **Response (200):**
```json
{
  "message": "Withdrawal approved",
  "withdrawal": {
    "_id": "707f1f77bcf86cd799439014",
    "status": "approved",
    "processed_date": "2024-01-20T18:00:00Z"
  },
  "workerNewBalance": 300
}
```

---

## 5. PAYMENT ENDPOINTS

### Get Coin Packages
- **URL:** `/payments/packages`
- **Method:** GET
- **Response (200):**
```json
[
  { "coins": 10, "price": 1 },
  { "coins": 150, "price": 10 },
  { "coins": 500, "price": 20 },
  { "coins": 1000, "price": 35 }
]
```

### Create Payment (Buyer Only)
- **URL:** `/payments/create-payment`
- **Method:** POST
- **Auth Required:** Yes (Buyer)
- **Body:**
```json
{
  "coins": 150
}
```
- **Response (201):**
```json
{
  "message": "Payment object created",
  "payment": {
    "_id": "807f1f77bcf86cd799439015",
    "coin_amount": 150,
    "price": 10,
    "currency": "USD"
  }
}
```

### Confirm Payment (Buyer Only)
- **URL:** `/payments/confirm/:paymentId`
- **Method:** PUT
- **Auth Required:** Yes (Buyer)
- **Body:**
```json
{
  "transactionId": "ch_1234567890abcdef"
}
```
- **Response (200):**
```json
{
  "message": "Payment completed successfully",
  "payment": {
    "_id": "807f1f77bcf86cd799439015",
    "status": "completed",
    "transaction_id": "ch_1234567890abcdef"
  },
  "newBalance": 450
}
```

### Dummy Payment (Testing Only)
- **URL:** `/payments/dummy-payment`
- **Method:** POST
- **Auth Required:** Yes (Buyer)
- **Body:**
```json
{
  "coins": 150
}
```
- **Response (201):**
```json
{
  "message": "Payment completed successfully",
  "payment": {
    "_id": "807f1f77bcf86cd799439015",
    "status": "completed"
  },
  "newBalance": 450
}
```

### Get Payment History (Buyer Only)
- **URL:** `/payments/history`
- **Method:** GET
- **Auth Required:** Yes (Buyer)
- **Query Parameters:**
  - `page` (default: 1)
  - `limit` (default: 10)
- **Response (200):**
```json
{
  "payments": [...],
  "total": 10,
  "pages": 1,
  "currentPage": 1
}
```

---

## 6. NOTIFICATION ENDPOINTS

### Get Notifications
- **URL:** `/notifications`
- **Method:** GET
- **Auth Required:** Yes
- **Query Parameters:**
  - `limit` (default: 10)
- **Response (200):**
```json
[
  {
    "_id": "907f1f77bcf86cd799439016",
    "toEmail": "user@example.com",
    "message": "Your submission has been approved!",
    "actionRoute": "/dashboard/worker-home",
    "type": "approval",
    "isRead": false,
    "createdAt": "2024-01-20T19:00:00Z"
  }
]
```

### Get Unread Notification Count
- **URL:** `/notifications/unread/count`
- **Method:** GET
- **Auth Required:** Yes
- **Response (200):**
```json
{
  "unreadCount": 5
}
```

### Mark Notification as Read
- **URL:** `/notifications/:id/read`
- **Method:** PUT
- **Auth Required:** Yes
- **Response (200):**
```json
{
  "_id": "907f1f77bcf86cd799439016",
  "isRead": true
}
```

---

## 7. ADMIN ENDPOINTS

### Get Dashboard Statistics
- **URL:** `/admin/stats`
- **Method:** GET
- **Auth Required:** Yes (Admin)
- **Response (200):**
```json
{
  "totalWorkers": 150,
  "totalBuyers": 50,
  "totalAdmins": 2,
  "totalCoins": 25000,
  "totalPaymentAmount": 5000
}
```

### Get All Users
- **URL:** `/admin/users`
- **Method:** GET
- **Auth Required:** Yes (Admin)
- **Query Parameters:**
  - `page` (default: 1)
  - `limit` (default: 10)
  - `role` (optional: worker/buyer/admin)
- **Response (200):**
```json
{
  "users": [...],
  "total": 200,
  "pages": 20,
  "currentPage": 1
}
```

### Update User Role (Admin Only)
- **URL:** `/admin/users/:id/role`
- **Method:** PUT
- **Auth Required:** Yes (Admin)
- **Body:**
```json
{
  "role": "admin"
}
```

### Delete User (Admin Only)
- **URL:** `/admin/users/:id`
- **Method:** DELETE
- **Auth Required:** Yes (Admin)

### Get All Tasks (Admin Only)
- **URL:** `/admin/tasks`
- **Method:** GET
- **Auth Required:** Yes (Admin)
- **Query Parameters:**
  - `page` (default: 1)
  - `limit` (default: 10)

### Delete Task (Admin Only)
- **URL:** `/admin/tasks/:id`
- **Method:** DELETE
- **Auth Required:** Yes (Admin)

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "All fields are required"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden: You do not have access to this resource"
}
```

### 404 Not Found
```json
{
  "error": "User/Task/Submission not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Something went wrong!"
}
```

---

## Rate Limiting & Precautions

For production, implement:
- Rate limiting per IP address
- Request validation
- Input sanitization
- CORS configuration
- HTTPS enforcement
- Request timeout
- Monitoring & logging
