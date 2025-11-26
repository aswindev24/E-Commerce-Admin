# E-commerce Admin Panel

A comprehensive admin panel for managing an e-commerce system built with the MERN stack (MongoDB, Express.js, React, Node.js).

## Features

### Admin Authentication
- Secure JWT-based authentication
- Default admin credentials (username: `admin`, password: `admin`)
- Protected routes and API endpoints

### Category Management
- Create, read, update, and delete categories
- Set category status (active/inactive)
- Add descriptions to categories

### SubCategory Management
- Manage subcategories linked to parent categories
- Filter subcategories by category
- Full CRUD operations

### Product Management
- Add products with detailed information
- Link products to categories and subcategories
- Manage product stock and pricing
- Add multiple product images
- Search and filter products
- Set product status (active/inactive/out of stock)

### Order Management
- View all customer orders
- Filter orders by status
- Update order status (pending, processing, shipped, delivered, cancelled)
- View detailed order information
- Track payment status

## Project Structure

```
EcommerceAdmin/
├── Backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── middleware/
│   │   └── auth.js            # JWT authentication middleware
│   ├── models/
│   │   ├── Admin.js           # Admin user model
│   │   ├── Category.js        # Category model
│   │   ├── SubCategory.js     # SubCategory model
│   │   ├── Product.js         # Product model
│   │   └── Order.js           # Order model
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   ├── category.js        # Category routes
│   │   ├── subcategory.js     # SubCategory routes
│   │   ├── product.js         # Product routes
│   │   └── order.js           # Order routes
│   ├── .env                   # Environment variables
│   ├── package.json           # Backend dependencies
│   └── server.js              # Express server
│
└── Frontend/
    ├── public/
    │   └── index.html         # HTML template
    ├── src/
    │   ├── components/
    │   │   ├── Login.js       # Login page
    │   │   ├── Dashboard.js   # Dashboard layout
    │   │   ├── Categories.js  # Category management
    │   │   ├── SubCategories.js # SubCategory management
    │   │   ├── Products.js    # Product management
    │   │   └── Orders.js      # Order management
    │   ├── services/
    │   │   └── api.js         # API service layer
    │   ├── App.js             # Main app component
    │   ├── index.js           # React entry point
    │   └── index.css          # Global styles
    └── package.json           # Frontend dependencies
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (running on localhost:27017)

### Backend Setup

1. Navigate to the Backend directory:
```bash
cd EcommerceAdmin/Backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
The `.env` file is already created with default values:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ecommerce_admin
JWT_SECRET=your_jwt_secret_key_change_this_in_production
NODE_ENV=development
```

4. Start MongoDB:
Make sure MongoDB is running on `localhost:27017`

5. Start the backend server:
```bash
npm start
```

The server will start on `http://localhost:5000` and automatically create a default admin user.

### Frontend Setup

1. Navigate to the Frontend directory:
```bash
cd EcommerceAdmin/Frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will open in your browser at `http://localhost:3000`

## Default Credentials

**Username:** admin  
**Password:** admin

> ⚠️ **Important:** Change the default password in production!

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `GET /api/auth/verify` - Verify JWT token

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get single category
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### SubCategories
- `GET /api/subcategories` - Get all subcategories (with optional category filter)
- `GET /api/subcategories/:id` - Get single subcategory
- `POST /api/subcategories` - Create subcategory
- `PUT /api/subcategories/:id` - Update subcategory
- `DELETE /api/subcategories/:id` - Delete subcategory

### Products
- `GET /api/products` - Get all products (with optional filters)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders
- `GET /api/orders` - Get all orders (with optional status filter)
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order status
- `DELETE /api/orders/:id` - Delete order

## Technologies Used

### Backend
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variables

### Frontend
- **React** - UI library
- **React Router** - Routing
- **Axios** - HTTP client
- **CSS3** - Styling with modern design system

## Features Highlights

### Modern UI/UX
- Premium gradient designs
- Smooth animations and transitions
- Responsive layout
- Modal-based forms
- Real-time status updates
- Interactive tables with inline editing

### Security
- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- Token expiration handling

### Data Management
- Full CRUD operations for all entities
- Cascading relationships (Category → SubCategory → Product)
- Search and filter functionality
- Status management
- Stock tracking

## Development Notes

- The backend runs on port 5000
- The frontend runs on port 3000
- MongoDB should be running on localhost:27017
- CORS is enabled for frontend-backend communication
- All API routes (except login) require JWT authentication

## Future Enhancements

- Image upload functionality
- Dashboard analytics and statistics
- Email notifications
- Export orders to CSV/PDF
- Multi-admin support with roles
- Product variants and options
- Inventory alerts
- Customer management
- Sales reports

## License

ISC
