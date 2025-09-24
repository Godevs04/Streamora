# Streamora Mobile App

A React Native mobile streaming app built with Expo, TypeScript, and NativeWind.

## Features

- User authentication (login, register)
- Video feed with infinite scrolling
- Video upload functionality
- User profiles
- Video search
- Like and comment on videos
- Push notifications

## Tech Stack

- **Expo**: React Native framework
- **TypeScript**: Type-safe JavaScript
- **NativeWind**: Tailwind CSS for React Native
- **React Navigation**: Stack and bottom tab navigation
- **Zustand**: State management
- **Axios**: API requests
- **Expo SecureStore**: Secure token storage
- **Firebase Cloud Messaging**: Push notifications

## Project Structure

```
/frontend
  /app                  # Expo Router screens
    /(auth)             # Authentication screens
    /(tabs)             # Tab screens
    _layout.tsx         # Root layout
    index.tsx           # Entry point
  /components           # Reusable components
  /services             # API services
  /store                # Zustand stores
  /constants            # App constants
  /utils                # Utility functions
  /types                # TypeScript types
  app.config.js         # Expo config
  tailwind.config.js    # Tailwind config
  .env.example          # Environment variables example
```

## Getting Started

### Prerequisites

- Node.js (LTS version)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (optional)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/streamora.git
cd streamora/frontend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file from the example:

```bash
cp .env.example .env
```

4. Update the `.env` file with your API URL and FCM sender ID:

```
API_BASE_URL=http://localhost:5000/api
EXPO_PUBLIC_API_BASE_URL=${API_BASE_URL}
EXPO_PUBLIC_FCM_SENDER_ID=your_fcm_sender_id
```

### Running the App

```bash
npx expo start
```

Then follow the instructions in the terminal to run on your preferred platform:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan the QR code with Expo Go app on your physical device

## Connecting to Backend

The app is designed to connect to the Streamora backend API. Make sure the backend server is running and update the `API_BASE_URL` in your `.env` file to point to your backend server.

## Push Notifications

To enable push notifications:

1. Set up a Firebase project and enable Cloud Messaging
2. Add your FCM sender ID to the `.env` file
3. For production, follow Expo's documentation on setting up push notifications

## Building for Production

To create a production build:

```bash
npx expo build:android  # For Android
npx expo build:ios      # For iOS
```

## License

This project is licensed under the MIT License.

## Author

Streamora Team
