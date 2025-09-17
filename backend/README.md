# Streamora Backend API

Backend API for Streamora mobile streaming app built with Node.js, Express, and MongoDB.

## Features

- User authentication with JWT
- Video uploads to Cloudinary
- Push notifications via Firebase Cloud Messaging (FCM)
- RESTful API design
- MongoDB database with Mongoose ODM
- File uploads with Multer

## Tech Stack

- Node.js (LTS)
- Express.js
- MongoDB with Mongoose
- JWT authentication
- Cloudinary for media storage
- Firebase Cloud Messaging for push notifications

## Prerequisites

- Node.js (LTS version recommended)
- MongoDB (local or Atlas)
- Cloudinary account
- Firebase project with FCM enabled

## Installation

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your environment variables:

```bash
cp .env.example .env
```

3. Install dependencies:

```bash
npm install
```

4. Start the development server:

```bash
npm run dev
```

5. For production:

```bash
npm start
```

## Environment Variables

Create a `.env` file with the following variables:

```
# Server
PORT=5000
CLIENT_URL=http://localhost:3000

# MongoDB
MONGO_URI=mongodb://localhost:27017/streamora

# JWT
JWT_SECRET=your_jwt_secret_here

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Firebase Cloud Messaging (FCM)
FCM_KEY_PAIR=your_fcm_key_pair
FCM_SENDER_ID=your_fcm_sender_id
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
  - Body: `{ name, email, password, username? }`
  - Returns: User object and JWT token

- `POST /api/auth/login` - Login user
  - Body: `{ email, password }`
  - Returns: User object and JWT token

- `GET /api/auth/me` - Get current user profile
  - Headers: `Authorization: Bearer YOUR_TOKEN`
  - Returns: User object

### Users

- `GET /api/users/:id` - Get user by ID
  - Returns: User public profile

- `PUT /api/users/me` - Update current user profile
  - Headers: `Authorization: Bearer YOUR_TOKEN`
  - Body: `{ name?, bio?, avatarUrl? }` or form-data with avatar file
  - Returns: Updated user object

### Videos

- `POST /api/videos` - Create a new video
  - Headers: `Authorization: Bearer YOUR_TOKEN`
  - Body: form-data with video file or JSON `{ videoUrl, title, description, tags[] }`
  - Returns: Created video object

- `GET /api/videos` - Get all videos with pagination
  - Query: `?page=1&limit=20&sort=recent|popular`
  - Returns: Array of videos with pagination metadata

- `GET /api/videos/:id` - Get video by ID
  - Returns: Video object with owner and comments

- `PUT /api/videos/:id/like` - Toggle like/unlike video
  - Headers: `Authorization: Bearer YOUR_TOKEN`
  - Returns: `{ liked: boolean, likesCount: number }`

- `PUT /api/videos/:id/view` - Increment video view count
  - Returns: `{ views: number }`

### Comments

- `POST /api/videos/:id/comments` - Create a new comment
  - Headers: `Authorization: Bearer YOUR_TOKEN`
  - Body: `{ text }`
  - Returns: Created comment object

- `GET /api/videos/:id/comments` - Get comments for a video
  - Query: `?page=1&limit=20&sort=newest|oldest`
  - Returns: Array of comments with pagination metadata

- `DELETE /api/comments/:commentId` - Delete a comment
  - Headers: `Authorization: Bearer YOUR_TOKEN`
  - Returns: Success message

### Notifications

- `POST /api/notifications/register` - Register FCM token for push notifications
  - Headers: `Authorization: Bearer YOUR_TOKEN`
  - Body: `{ fcmToken }`
  - Returns: Success message

- `POST /api/notifications/send` - Send push notification (admin only)
  - Headers: `Authorization: Bearer YOUR_TOKEN`
  - Body: `{ title, body, recipientUserId }`
  - Returns: Success message and FCM response

## Example API Requests

### Register User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "username": "johndoe"
  }'
```

### Login User

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Upload Video

```bash
curl -X POST http://localhost:5000/api/videos \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=My First Video" \
  -F "description=This is my first video on Streamora" \
  -F "tags=[\"fun\", \"first\"]" \
  -F "video=@/path/to/video.mp4"
```

### Post Comment

```bash
curl -X POST http://localhost:5000/api/videos/VIDEO_ID/comments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Great video!"
  }'
```

### Like Video

```bash
curl -X PUT http://localhost:5000/api/videos/VIDEO_ID/like \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## License

This project is licensed under the MIT License.

## Author

Streamora Team
