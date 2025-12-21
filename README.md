# ChatWe - MERN Chat Application

A real-time chat application built with the MERN stack featuring Google OAuth authentication, real-time messaging, file sharing, emoji/GIF support, and voice/video calls.

## Features

- 🔐 **Google OAuth Authentication**
- 💬 **Real-time Messaging** with Socket.IO
- 📁 **File Sharing** - Share any file type
- 😀 **Emoji & GIF Support** - Powered by Emoji Mart and GIPHY
- 📞 **Voice Calls** - WebRTC powered
- 🎥 **Video Calls** - WebRTC powered
- 🟢 **Online Status** - See who's online
- 📱 **Responsive Design** - Works on all devices

## Tech Stack

- **Frontend:** React, Vite, Socket.IO Client, Simple-Peer (WebRTC)
- **Backend:** Node.js, Express, Socket.IO, Passport.js
- **Database:** MongoDB with Mongoose
- **Authentication:** Google OAuth 2.0

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Google Cloud Console account (for OAuth)
- GIPHY API key (optional, for GIFs)

## Environment Variables

### Client (`client/.env`)
```env
VITE_API_URL=http://localhost:5000
VITE_GIPHY_API_KEY=your_giphy_api_key
```

### Server (`server/.env`)
```env
MONGODB_URI=mongodb://localhost:27017/mern-chat
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=your_session_secret
CLIENT_URL=http://localhost:5173
PORT=5000
```

## Installation

### 1. Clone the repository
```bash
git clone https://github.com/Vasugoyal3036/Chat-App.git
cd Chat-App
```

### 2. Install dependencies
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Set up environment variables
Copy the `.env.example` files to `.env` in both `client` and `server` directories and fill in your values.

### 4. Run the application
```bash
# Terminal 1 - Start server
cd server
npm run dev

# Terminal 2 - Start client
cd client
npm run dev
```

### 5. Open in browser
Navigate to `http://localhost:5173`

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select existing
3. Create OAuth 2.0 Client ID credentials
4. Add authorized JavaScript origins:
   - `http://localhost:5173` (development)
   - `https://your-frontend-domain.com` (production)
5. Add authorized redirect URIs:
   - `http://localhost:5000/auth/google/callback` (development)
   - `https://your-backend-domain.com/auth/google/callback` (production)

## Deployment

### Frontend (Vercel)
1. Connect your GitHub repo to Vercel
2. Set the root directory to `client`
3. Add environment variable: `VITE_API_URL=https://your-backend-url.com`

### Backend (Render)
1. Connect your GitHub repo to Render
2. Set the root directory to `server`
3. Add all server environment variables
4. Set build command: `npm install`
5. Set start command: `npm start`

## License

MIT
