# Environment Variables Reference

## Required Variables

### Database Configuration
```env
MONGODB_URI=mongodb+srv://username:password@cluster-name.mongodb.net/database-name?retryWrites=true&w=majority
```
- Replace `username` with your MongoDB user
- Replace `password` with your MongoDB password
- Replace `cluster-name` with your cluster name
- Example: `mongodb+srv://john:pass123@cluster0.abc123.mongodb.net/micro-task-platform?retryWrites=true&w=majority`

### Authentication
```env
JWT_SECRET=your_super_secret_key_change_this_in_production
```
- Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- NEVER commit this to version control
- Make it at least 32 characters

### Server Configuration
```env
PORT=5000
NODE_ENV=development
```
- Change PORT if 5000 is already in use
- Set NODE_ENV to "production" when deployed

### Optional: Stripe Integration (For Future)
```env
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
```

## Environment Setup Instructions

### Windows
1. Open `.env` file in your text editor
2. Replace placeholder values with actual values
3. Save the file
4. Restart `npm run dev`

### macOS / Linux
1. Open terminal in server directory
2. Run: `nano .env`
3. Replace placeholder values
4. Press Ctrl+X, then Y, then Enter to save
5. Run: `npm run dev`

## Verification
```bash
# Test if server reads environment variables correctly
node -e "require('dotenv').config(); console.log('Port:', process.env.PORT, 'Node Env:', process.env.NODE_ENV)"
```

## Security Notes
- ❌ NEVER commit .env file (already in .gitignore)
- ❌ NEVER share JWT_SECRET publicly
- ❌ NEVER hardcode credentials in code
- ✅ Always use .env file for sensitive data
- ✅ Keep .env.example for reference (without real values)
- ✅ Use strong, unique JWT_SECRET
- ✅ Restrict MongoDB access by IP in production
