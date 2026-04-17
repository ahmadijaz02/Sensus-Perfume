# Sensus Perfumes Backend API

Production-ready Node.js/Express backend with MongoDB Atlas integration.

## Features

- ✅ MongoDB Atlas connection
- ✅ JWT authentication
- ✅ Bcrypt password hashing
- ✅ Admin role management
- ✅ Order management system
- ✅ CORS configuration
- ✅ Input validation
- ✅ Error handling

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

The `.env` file is already configured with your MongoDB connection string:

```env
MONGODB_URI=mongodb+srv://mahmadijaz192:mahmadijaz192@cluster0a.e4g2z.mongodb.net/sensus-perfumes?retryWrites=true&w=majority
JWT_SECRET=sensus-perfumes-secret-key-change-in-production-2024
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:8080
```

⚠️ **Important**: Change `JWT_SECRET` in production!

### 3. Start Backend Server

```bash
npm run dev
```

The server will start on http://localhost:5000

## API Endpoints

### Authentication

#### Register
```
POST /api/auth/register
Body: { email, password, name }
Returns: { token, user }
```

#### Login
```
POST /api/auth/login
Body: { email, password }
Returns: { token, user }
```

#### Get Current User
```
GET /api/auth/me
Headers: { Authorization: "Bearer <token>" }
Returns: { id, email, name, role }
```

### Orders

#### Create Order
```
POST /api/orders
Body: {
  customer_email,
  customer_name,
  shipping_address,
  total_amount,
  items: []
}
Returns: { id, ...order }
```

#### Get All Orders (Admin)
```
GET /api/orders
Headers: { Authorization: "Bearer <token>" }
Returns: [ ...orders ]
```

#### Get My Orders
```
GET /api/orders/my-orders
Headers: { Authorization: "Bearer <token>" }
Returns: [ ...orders ]
```

#### Get Order by ID
```
GET /api/orders/:id
Headers: { Authorization: "Bearer <token>" }
Returns: { ...order }
```

#### Update Order Status (Admin)
```
PATCH /api/orders/:id/status
Headers: { Authorization: "Bearer <token>" }
Body: { status }
Returns: { ...order }
```

#### Update Tracking (Admin)
```
PATCH /api/orders/:id/tracking
Headers: { Authorization: "Bearer <token>" }
Body: { tracking_number, notes }
Returns: { ...order }
```

## Database Collections

### users
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  name: String,
  role: String (user/admin),
  created_at: Date,
  updated_at: Date
}
```

### orders
```javascript
{
  _id: ObjectId,
  user_id: String (optional),
  customer_email: String,
  customer_name: String,
  shipping_address: String,
  total_amount: Number,
  status: String (pending/confirmed/processing/shipped/delivered/cancelled),
  tracking_number: String (optional),
  notes: String (optional),
  items: [{
    product_id: String,
    product_name: String,
    quantity: Number,
    price: Number
  }],
  created_at: Date,
  updated_at: Date
}
```

## Creating Admin User

To create an admin user, you'll need to manually update a user in MongoDB:

1. Register a normal user account
2. Go to MongoDB Atlas Dashboard
3. Browse Collections → sensus-perfumes → users
4. Find your user and click Edit
5. Change `role` from `"user"` to `"admin"`
6. Save

Alternatively, use MongoDB Compass or the MongoDB shell to update:

```javascript
db.users.updateOne(
  { email: "youremail@example.com" },
  { $set: { role: "admin" } }
)
```

## Security Features

- ✅ Password hashing with bcrypt (10 rounds)
- ✅ JWT tokens with 7-day expiration
- ✅ Protected routes with authentication middleware
- ✅ Admin-only endpoints
- ✅ Input validation with express-validator
- ✅ CORS protection
- ✅ Environment variable protection

## Development

```bash
# Install dependencies
npm install

# Run with auto-reload
npm run dev

# Run in production
npm start
```

## Deployment

### Recommended Platforms

1. **Railway** (Easiest)
   - Connect GitHub repo
   - Auto-deploy on push
   - Free tier available

2. **Render**
   - Free tier
   - Auto-deploy
   - Built-in environment variables

3. **Heroku**
   - Classic platform
   - Easy deployment
   - Good documentation

4. **DigitalOcean App Platform**
   - $5/month
   - Good performance
   - Easy scaling

### Deployment Steps (Railway Example)

1. Push code to GitHub
2. Go to railway.app
3. Create new project from GitHub
4. Select your repository
5. Add environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `FRONTEND_URL` (your deployed frontend URL)
   - `NODE_ENV=production`
6. Deploy!

## Environment Variables for Production

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=generate_a_strong_secret_key
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
```

## Testing the API

### Using curl

```bash
# Health check
curl http://localhost:5000/api/health

# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Using Postman

1. Import the API endpoints
2. Set up environment variables
3. Test each endpoint
4. Save the JWT token for authenticated requests

## Troubleshooting

### MongoDB Connection Issues
- Check your IP whitelist in MongoDB Atlas
- Verify connection string is correct
- Ensure network allows outbound connections

### CORS Errors
- Update `FRONTEND_URL` in `.env`
- Check CORS configuration in `server.js`

### Authentication Errors
- Verify JWT_SECRET is set
- Check token expiration
- Ensure Authorization header format: `Bearer <token>`

## Production Checklist

- [ ] Change JWT_SECRET to a strong random string
- [ ] Enable MongoDB Atlas IP whitelist (or allow all for serverless)
- [ ] Set NODE_ENV=production
- [ ] Update FRONTEND_URL to production domain
- [ ] Enable HTTPS
- [ ] Set up monitoring/logging
- [ ] Configure rate limiting
- [ ] Set up database backups
- [ ] Review security settings

## Support

For issues or questions, check:
1. MongoDB Atlas connection status
2. Server logs for errors
3. Frontend API configuration
4. Environment variables are correctly set
