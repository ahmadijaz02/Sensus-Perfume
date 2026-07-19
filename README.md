# Sensus Perfume 

A full-stack luxury fragrance e-commerce website built with React, TypeScript, Node.js, and MongoDB.

🌐 **Live Site:** [sensusperfume.com](https://sensusperfume.com)

---

## Features

### Customer-Facing
- **Product Catalog** — Browse fragrances by category: Men, Women, and Unisex
- **Product Search** — Search by name, brand, description, or fragrance notes
- **Product Detail Pages** — View fragrance notes, sizes, and variants
- **Shopping Cart** — Persistent cart with real-time updates
- **Checkout** — Seamless order placement flow
- **User Authentication** — Register, login, and manage your account
- **Newsletter Subscription** — Subscribe for exclusive offers and new releases

### Admin Panel
- **Dashboard** — Overview of orders, revenue, products, and pending orders
- **Product Management** — Add, edit, and remove products
- **Order Management** — View and update order statuses
- **Customer Management** — Browse registered customers
- **Reports** — Sales analytics and reporting
- **Site Settings** — Configure store-level settings

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite | Build tool |
| Tailwind CSS | Styling |
| shadcn/ui + Radix UI | Component library |
| React Router v6 | Client-side routing |
| TanStack Query | Server state management |
| React Hook Form + Zod | Forms and validation |
| Sonner | Toast notifications |
| Recharts | Charts and analytics |
| Meta Pixel | Facebook/Instagram ad tracking |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| MongoDB | Database |
| JWT | Authentication |
| bcryptjs | Password hashing |
| Nodemailer | Order notification emails |
| Multer | File/image uploads |
| express-validator | Request validation |

---

## Project Structure

```
Sensus-Perfume/
├── Frontend/           # React + Vite application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Route-level page components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── lib/        # API client and utilities
│   │   ├── context/    # React context providers
│   │   └── types/      # TypeScript type definitions
│   ├── public/         # Static assets
│   └── package.json
│
└── backend/            # Node.js + Express API
    ├── routes/         # API route handlers
    │   ├── auth.js     # Authentication (register/login)
    │   ├── products.js # Product CRUD
    │   ├── orders.js   # Order management
    │   ├── users.js    # User management
    │   ├── cart.js     # Shopping cart
    │   ├── newsletter.js # Newsletter subscriptions
    │   └── settings.js # Site settings
    ├── middleware/     # Express middleware
    ├── server.js       # Entry point
    └── package.json
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (Atlas or local instance)

### 1. Clone the Repository

```bash
git clone https://github.com/ahmadijaz02/Sensus-Perfume.git
cd Sensus-Perfume
```

### 2. Set Up the Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:5173
ORDER_NOTIFY_EMAIL=your_email@example.com
SMTP_HOST=your_smtp_host
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
FROM_EMAIL="Sensus Perfumes <no-reply@yourdomain.com>"
```

Start the backend server:

```bash
npm run dev     # Development (with nodemon)
npm start       # Production
```

The API will be available at `http://localhost:5000`.

### 3. Set Up the Frontend

```bash
cd Frontend
npm install
```

Create a `.env` file in the `Frontend/` directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_META_PIXEL_ID=your_meta_pixel_id   # Optional
```

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/products` | List all products |
| GET | `/api/products/:id` | Get a single product |
| POST | `/api/products` | Create a product (admin) |
| PUT | `/api/products/:id` | Update a product (admin) |
| DELETE | `/api/products/:id` | Delete a product (admin) |
| GET | `/api/orders` | List orders |
| POST | `/api/orders` | Place an order |
| GET | `/api/cart` | Get cart |
| POST | `/api/cart` | Update cart |
| GET | `/api/users` | List users (admin) |
| POST | `/api/newsletter` | Subscribe to newsletter |
| GET | `/api/health` | Health check |

---

## Deployment

The application is deployed at [sensusperfume.com](https://sensusperfume.com).

- **Frontend** — Deployed on a static hosting provider (configured via `vercel.json`)
- **Backend** — Node.js server with environment variables configured for production

To build the frontend for production:

```bash
cd Frontend
npm run build
```

---

## License

This project is licensed under the terms of the [LICENSE](./LICENSE) file.
