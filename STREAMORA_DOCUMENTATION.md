# Streamora Project Documentation

## Overview

Streamora is a video streaming platform built with React Native (Expo) for the frontend and Node.js/Express/MongoDB for the backend. This documentation provides a comprehensive guide to the project structure, setup, and troubleshooting.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Setup Instructions](#setup-instructions)
3. [Frontend Architecture](#frontend-architecture)
4. [Backend Architecture](#backend-architecture)
5. [Authentication Flow](#authentication-flow)
6. [API Reference](#api-reference)
7. [Common Issues & Solutions](#common-issues--solutions)
8. [Development Workflow](#development-workflow)

## Project Structure

The project is organized into two main directories:

### Frontend (React Native with Expo)

```
frontend/
├── app/                    # Main application screens (Expo Router)
│   ├── _layout.tsx         # Root layout for the app
│   ├── index.tsx           # Entry point for navigation
│   ├── (auth)/             # Authentication screens
│   │   ├── login.tsx       # Login screen
│   │   └── register.tsx    # Registration screen
│   └── (tabs)/             # Tab navigation screens
│       ├── _layout.tsx     # Tab navigation configuration
│       ├── home.tsx        # Home feed screen
│       ├── explore.tsx     # Explore/discovery screen
│       ├── upload.tsx      # Video upload screen
│       └── profile.tsx     # User profile screen
├── assets/                 # Static assets (images, fonts)
├── components/             # Reusable UI components
│   ├── Avatar.tsx          # User avatar component
│   ├── Button.tsx          # Custom button component
│   ├── Input.tsx           # Form input component
│   ├── VideoCard.tsx       # Video display component
│   └── ErrorBoundary.tsx   # Error handling component
├── constants/              # App constants and configuration
│   ├── colors.ts           # Color palette
│   └── config.ts           # App configuration
├── services/               # API service functions
│   ├── api.ts              # Base API configuration
│   ├── auth.ts             # Authentication services
│   ├── videos.ts           # Video-related services
│   └── notifications.ts    # Notification services
├── store/                  # State management
│   └── useAuthStore.ts     # Authentication state
├── types/                  # TypeScript type definitions
│   └── index.ts            # Shared type definitions
├── utils/                  # Utility functions
│   ├── formatDate.ts       # Date formatting utilities
│   ├── notifications.ts    # Notification helpers
│   └── validators.ts       # Form validation functions
├── App.tsx                 # Main App component
├── app.config.js           # Expo configuration
└── package.json            # Dependencies and scripts
```

### Backend (Node.js/Express/MongoDB)

```
backend/
├── config/                 # Configuration files
│   ├── db.js               # Database connection
│   └── cloudinary.js       # Media storage configuration
├── controllers/            # Request handlers
│   ├── authController.js   # Authentication logic
│   ├── usersController.js  # User management
│   ├── videosController.js # Video management
│   ├── commentsController.js # Comment handling
│   └── notificationsController.js # Notification handling
├── middlewares/            # Express middlewares
│   ├── auth.js             # Authentication middleware
│   ├── upload.js           # File upload middleware
│   ├── validate.js         # Request validation
│   └── errorHandler.js     # Error handling middleware
├── models/                 # MongoDB schema definitions
│   ├── User.js             # User model
│   ├── Video.js            # Video model
│   └── Comment.js          # Comment model
├── routes/                 # API route definitions
│   ├── authRoutes.js       # Authentication routes
│   ├── userRoutes.js       # User-related routes
│   ├── videoRoutes.js      # Video-related routes
│   ├── commentRoutes.js    # Comment routes
│   └── notificationRoutes.js # Notification routes
├── utils/                  # Utility functions
│   ├── generateToken.js    # JWT token generation
│   └── sendResponse.js     # Response formatting
├── server.js               # Express server setup
└── package.json            # Dependencies and scripts
```

## Setup Instructions

### Prerequisites

- Node.js (v14+)
- npm or yarn
- MongoDB (local or Atlas)
- Expo CLI (`npm install -g expo-cli`)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   PORT=5001
   MONGO_URI=mongodb://localhost:27017/streamora
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRE=30d
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with:
   ```
   EXPO_PUBLIC_API_BASE_URL=http://localhost:5001/api
   ```

4. Start the Expo development server:
   ```bash
   npx expo start
   ```

## Frontend Architecture

### Expo Router

The app uses Expo Router for navigation, which provides a file-system based routing similar to Next.js.

- `app/_layout.tsx`: Root layout that handles authentication state and initial loading
- `app/index.tsx`: Redirects to either login or home based on authentication state
- `app/(auth)/_layout.tsx`: Layout for authentication screens
- `app/(tabs)/_layout.tsx`: Tab-based navigation layout

### State Management

Authentication state is managed with Zustand:

```typescript
// store/useAuthStore.ts
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  
  // Actions for login, logout, registration, etc.
}));
```

### API Integration

API calls are handled through Axios with interceptors for authentication and error handling:

```typescript
// services/api.ts
import axios from 'axios';
import config from '../constants/config';
import * as SecureStore from 'expo-secure-store';

const api = axios.create({
  baseURL: config.BASE_URL,
});

// Request interceptor for adding auth token
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Error handling logic
    return Promise.reject(customError);
  }
);
```

## Backend Architecture

### Express Server Setup

The Express server is configured in `server.js` with middleware for CORS, JSON parsing, and error handling.

### Authentication

JWT-based authentication is implemented using:
- Token generation in `utils/generateToken.js`
- Authentication middleware in `middlewares/auth.js`
- Login/register controllers in `controllers/authController.js`

### Database Models

MongoDB schemas are defined using Mongoose:

```javascript
// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    // Additional validation
  },
  // Other fields
});

// Password hashing middleware
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to check password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
```

## Authentication Flow

1. **Registration**: User submits registration form → Backend validates input → Creates user in database → Returns JWT token
2. **Login**: User submits credentials → Backend validates → Returns JWT token
3. **Token Storage**: Frontend stores token in SecureStore
4. **Protected Routes**: Frontend includes token in API requests → Backend middleware validates token

## API Reference

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login existing user
- `GET /api/auth/me` - Get current user details

### Users

- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `GET /api/users/:id/videos` - Get videos by user

### Videos

- `GET /api/videos` - Get videos (with pagination)
- `GET /api/videos/:id` - Get video by ID
- `POST /api/videos` - Upload new video
- `PUT /api/videos/:id` - Update video
- `DELETE /api/videos/:id` - Delete video
- `PUT /api/videos/:id/like` - Like/unlike video
- `PUT /api/videos/:id/view` - Increment view count

### Comments

- `GET /api/videos/:videoId/comments` - Get comments for video
- `POST /api/videos/:videoId/comments` - Add comment to video
- `DELETE /api/comments/:id` - Delete comment

### Notifications

- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read

## Common Issues & Solutions

### White Screen on App Launch

**Issue**: App shows white screen on startup without any error messages.

**Solution**: 
1. Simplify App.tsx to be a minimal entry point
2. Add force render logic in _layout.tsx
3. Implement proper splash screen handling
4. Add error boundaries for crash prevention

```typescript
// Force UI rendering with timeout
const [forceRender, setForceRender] = React.useState(false);

React.useEffect(() => {
  const timer = setTimeout(() => {
    setForceRender(true);
  }, 500);
  
  return () => clearTimeout(timer);
}, []);
```

### Authentication Navigation Issues

**Issue**: After login/register, app doesn't navigate to home screen.

**Solution**: Add explicit navigation after successful authentication.

```typescript
const handleLogin = async () => {
  try {
    await login({ email, password });
    // Force navigation to home after successful login
    router.replace('/(tabs)/home');
  } catch (error) {
    // Error handling
  }
};
```

### Metro Bundler Errors

**Issue**: "TypeError: iterator method is not callable" in API calls.

**Solution**: Remove problematic parameters or add proper type assertions.

```typescript
// Remove problematic sort parameter
const response = await getVideos({
  page: currentPage,
  limit: 20
  // sort: 'recent' - removed to fix the error
});
```

### Tabs Import Error

**Issue**: Error importing Tabs from expo-router.

**Solution**: Import from the specific tabs module.

```typescript
// Incorrect:
import { Tabs } from 'expo-router';

// Correct:
import { Tabs } from 'expo-router/tabs';
```

### Backend Connection Issues

**Issue**: Cannot connect to MongoDB.

**Solution**: Add fallback MongoDB URI.

```javascript
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/streamora';
    const conn = await mongoose.connect(mongoURI, {
      dbName: 'streamora'
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};
```

### CORS Issues

**Issue**: Frontend cannot connect to backend due to CORS errors.

**Solution**: Configure CORS properly in the backend.

```javascript
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));
```

## Development Workflow

### Running the App

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend Expo server:
   ```bash
   cd frontend
   npx expo start
   ```

3. Run on a simulator or device:
   - Press `i` for iOS simulator
   - Press `a` for Android simulator
   - Scan QR code with Expo Go app on physical device

### Cleaning Cache

If you encounter bundling issues:

```bash
# Remove cache directories
rm -rf frontend/node_modules/.cache
rm -rf frontend/node_modules/.expo

# Start with clean cache
cd frontend
npx expo start --clear --reset-cache
```

### Debugging

1. **React DevTools**: Use React DevTools for component inspection
2. **Console Logs**: Check terminal for backend logs and Expo DevTools for frontend logs
3. **Error Boundaries**: The app includes an ErrorBoundary component to catch and display React errors

### Building for Production

1. Backend:
   ```bash
   cd backend
   npm run build
   ```

2. Frontend (Expo):
   ```bash
   cd frontend
   eas build --platform all
   ```

---

## Contributors

- Kavin Kumar - Lead Developer

## License

This project is licensed under the MIT License - see the LICENSE file for details.
