# Deployment Guide - MERN Chat Application

This guide will help you deploy your MERN chat application to the web using Render.com.

## Prerequisites

1. GitHub account
2. MongoDB Atlas account (free tier)
3. Google Cloud Console account
4. GIPHY API key (optional)
5. Render.com account (free)

## Step 1: Setup MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string (looks like: `mongodb+srv://username:<password>@cluster.mongodb.net/chatapp?retryWrites=true&w=majority`)
5. Replace `<password>` with your database password
6. **Important**: Under "Network Access", add `0.0.0.0/0` to allow connections from anywhere

## Step 2: Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set Application Type to "Web application"
6. Add Authorized JavaScript origins:
   - Your Render frontend URL (e.g., `https://mern-chat-frontend.onrender.com`)
7. Add Authorized redirect URIs:
   - Your Render backend URL + `/auth/google/callback` (e.g., `https://mern-chat-backend.onrender.com/auth/google/callback`)
8. Save your Client ID and Client Secret

## Step 3: Get GIPHY API Key (Optional)

1. Go to [GIPHY Developers](https://developers.giphy.com/)
2. Create an account and create a new app
3. Copy your API key

## Step 4: Push Code to GitHub

1. Initialize git repository (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. Create a new repository on GitHub

3. Push your code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git branch -M main
   git push -u origin main
   ```

## Step 5: Deploy on Render

### Option A: Using render.yaml (Recommended - Automated)

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file
5. Add the following environment variables when prompted:

**For Backend Service:**
- `MONGODB_URI`: Your MongoDB Atlas connection string
- `GOOGLE_CLIENT_ID`: From Google Cloud Console
- `GOOGLE_CLIENT_SECRET`: From Google Cloud Console
- `CLIENT_URL`: Your frontend URL (will be like `https://mern-chat-frontend.onrender.com`)

**For Frontend Service:**
- `VITE_API_URL`: Your backend URL (will be like `https://mern-chat-backend.onrender.com`)
- `VITE_GIPHY_API_KEY`: Your GIPHY API key (optional)

6. Click "Apply" to deploy both services

### Option B: Manual Deployment

#### Deploy Backend:

1. Go to Render Dashboard
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: mern-chat-backend
   - **Region**: Choose closest to your users
   - **Branch**: main
   - **Root Directory**: server
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. Add Environment Variables (same as Option A backend)

6. Click "Create Web Service"

#### Deploy Frontend:

1. Click "New" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: mern-chat-frontend
   - **Branch**: main
   - **Root Directory**: client
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: dist
   - **Plan**: Free

4. Add Environment Variables (same as Option A frontend)

5. Click "Create Static Site"

## Step 6: Update Configuration

After deployment, you need to update some URLs:

1. **Update Google OAuth Redirect URI**:
   - Go back to Google Cloud Console
   - Add your actual Render backend URL to authorized redirect URIs
   - Format: `https://your-backend-url.onrender.com/auth/google/callback`

2. **Update Backend Environment Variable**:
   - In Render dashboard, go to your backend service
   - Update `CLIENT_URL` to your actual frontend URL

3. **Update Frontend Environment Variable**:
   - In Render dashboard, go to your frontend static site
   - Update `VITE_API_URL` to your actual backend URL

4. **Redeploy** both services for changes to take effect

## Step 7: Verify Deployment

1. Visit your frontend URL
2. Try logging in with Google
3. Test messaging, file upload, and video/voice calls
4. Check browser console for any errors

## Important Notes

### Free Tier Limitations
- Render free tier services spin down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds
- Consider upgrading to paid tier for production use

### WebSocket/Socket.IO
- Render's free tier supports WebSocket connections
- No additional configuration needed

### File Uploads
- Uploaded files are stored on the server's filesystem
- **Warning**: On Render's free tier, filesystem is ephemeral (files are lost on service restart)
- For production, consider using AWS S3, Cloudinary, or similar cloud storage

### CORS Configuration
- The app is already configured for cross-origin requests
- Make sure `CLIENT_URL` and `VITE_API_URL` are set correctly

## Alternative Hosting Options

### 1. Vercel (Frontend) + Render (Backend)
- Deploy React app on Vercel: `vercel --prod`
- Keep backend on Render

### 2. Netlify (Frontend) + Railway (Backend)
- Netlify for static frontend
- Railway for backend with better persistent storage

### 3. Heroku (Full Stack)
- More expensive but more reliable
- Better for production apps

### 4. AWS/DigitalOcean
- More control but requires more setup
- Best for scalable production deployments

## Troubleshooting

### Login not working
- Check Google OAuth credentials and redirect URIs
- Verify `CLIENT_URL` and `VITE_API_URL` are correct
- Check browser console for CORS errors

### Messages not sending
- Check Socket.IO connection in browser console
- Verify backend is running and accessible
- Check MongoDB connection

### Video/Voice calls failing
- WebRTC requires HTTPS (Render provides this by default)
- Check browser permissions for camera/microphone
- Some browsers may block WebRTC on certain networks

### 504 Gateway Timeout
- Free tier services take time to spin up
- Wait 30-60 seconds and try again

## Monitoring

- Check Render logs for backend errors
- Use MongoDB Atlas monitoring for database issues
- Monitor usage to avoid hitting free tier limits

## Cost Optimization

Free tier services for low traffic:
- Render: Free (with spin-down)
- MongoDB Atlas: Free (512MB storage)
- Total: $0/month

For production with always-on services:
- Render Starter: $7/month per service ($14 total)
- MongoDB Atlas: Free or $9/month for more storage
- Total: ~$14-23/month

## Support

For issues:
1. Check Render logs for error messages
2. Verify all environment variables are set correctly
3. Check MongoDB Atlas network access settings
4. Review Google OAuth configuration

---

**Congratulations!** Your MERN chat app should now be live on the web! 🎉
