# Deployment Checklist

Use this checklist to ensure smooth deployment of your MERN chat app.

## Pre-Deployment Setup

### MongoDB Atlas
- [ ] Created MongoDB Atlas account
- [ ] Created free cluster
- [ ] Created database user with password
- [ ] Copied connection string
- [ ] Added IP whitelist: `0.0.0.0/0` (Network Access)
- [ ] Tested connection string locally

### Google OAuth
- [ ] Created Google Cloud project
- [ ] Enabled Google+ API
- [ ] Created OAuth 2.0 Client ID
- [ ] Copied Client ID
- [ ] Copied Client Secret
- [ ] Added local redirect URI: `http://localhost:5000/auth/google/callback`

### GIPHY (Optional)
- [ ] Created GIPHY developer account
- [ ] Created app and got API key

### Environment Variables Setup
- [ ] Created `server/.env` with all required variables
- [ ] Created `client/.env` with VITE_API_URL and GIPHY key
- [ ] Tested app locally with these variables
- [ ] Added `.env` files to `.gitignore` (DO NOT commit)

### GitHub Repository
- [ ] Created GitHub repository
- [ ] Initialized git in project: `git init`
- [ ] Added all files: `git add .`
- [ ] Made initial commit: `git commit -m "Initial commit"`
- [ ] Added remote: `git remote add origin YOUR_REPO_URL`
- [ ] Pushed to GitHub: `git push -u origin main`

## Deployment on Render

### Backend Service
- [ ] Created new Web Service on Render
- [ ] Connected GitHub repository
- [ ] Set root directory to `server`
- [ ] Set build command: `npm install`
- [ ] Set start command: `npm start`
- [ ] Added environment variable: `MONGODB_URI`
- [ ] Added environment variable: `GOOGLE_CLIENT_ID`
- [ ] Added environment variable: `GOOGLE_CLIENT_SECRET`
- [ ] Added environment variable: `SESSION_SECRET`
- [ ] Added environment variable: `CLIENT_URL` (temporary)
- [ ] Added environment variable: `PORT=10000`
- [ ] Added environment variable: `NODE_ENV=production`
- [ ] Deployed backend service
- [ ] Copied backend URL: `https://_____.onrender.com`
- [ ] Verified backend is running (check `/health` endpoint)

### Frontend Service
- [ ] Created new Static Site on Render
- [ ] Connected GitHub repository
- [ ] Set root directory to `client`
- [ ] Set build command: `npm install && npm run build`
- [ ] Set publish directory: `dist`
- [ ] Added environment variable: `VITE_API_URL` (temporary)
- [ ] Added environment variable: `VITE_GIPHY_API_KEY` (optional)
- [ ] Deployed frontend service
- [ ] Copied frontend URL: `https://_____.onrender.com`
- [ ] Verified frontend loads

## Post-Deployment Configuration

### Update Google OAuth
- [ ] Opened Google Cloud Console
- [ ] Edited OAuth 2.0 Client
- [ ] Added authorized redirect URI with ACTUAL backend URL:
  - `https://YOUR-BACKEND.onrender.com/auth/google/callback`
- [ ] Added authorized JavaScript origin:
  - `https://YOUR-FRONTEND.onrender.com`
- [ ] Saved changes

### Update Render Environment Variables
- [ ] Updated backend `CLIENT_URL` to actual frontend URL
- [ ] Updated frontend `VITE_API_URL` to actual backend URL
- [ ] Triggered manual redeploy of backend
- [ ] Triggered manual redeploy of frontend
- [ ] Waited for both services to redeploy (~5 min)

## Testing

### Basic Functionality
- [ ] Opened frontend URL in browser
- [ ] Clicked "Login with Google"
- [ ] Successfully logged in
- [ ] Saw user list
- [ ] Sent a message
- [ ] Received a message
- [ ] Checked real-time updates work

### Advanced Features
- [ ] Tested emoji picker
- [ ] Tested GIF picker (if GIPHY configured)
- [ ] Uploaded a file
- [ ] Downloaded uploaded file
- [ ] Tested voice call (if needed)
- [ ] Tested video call (if needed)
- [ ] Checked online/offline status updates

### Error Checking
- [ ] Checked browser console for errors
- [ ] Checked Render backend logs
- [ ] Checked MongoDB Atlas metrics
- [ ] Verified no CORS errors
- [ ] Tested on mobile device

## Optional Enhancements

### Custom Domain
- [ ] Purchased domain name
- [ ] Added custom domain in Render settings
- [ ] Updated DNS records
- [ ] Updated Google OAuth URLs
- [ ] Updated environment variables

### Monitoring
- [ ] Set up Render notifications
- [ ] Set up MongoDB Atlas alerts
- [ ] Added monitoring dashboard

### Performance
- [ ] Considered upgrading to paid tier (no cold starts)
- [ ] Set up CDN for static assets
- [ ] Optimized images and assets
- [ ] Set up cloud storage for file uploads (S3, Cloudinary)

## Maintenance

### Regular Tasks
- [ ] Monitor Render usage and logs
- [ ] Monitor MongoDB Atlas storage
- [ ] Update dependencies monthly
- [ ] Review and rotate secrets quarterly
- [ ] Backup database regularly
- [ ] Check for security updates

## Troubleshooting Reference

**Problem**: Login fails
- Check Google OAuth credentials
- Verify redirect URIs match exactly
- Check browser console for CORS errors

**Problem**: Messages not sending
- Check Socket.IO connection
- Verify backend is running
- Check MongoDB connection

**Problem**: 504 Gateway Timeout
- Free tier is waking up, wait 60 seconds
- Check Render logs for errors

**Problem**: Files not uploading
- Check file size limits
- Verify uploads directory exists
- Consider using cloud storage

---

## Deployment Information

**Frontend URL**: ___________________________

**Backend URL**: ___________________________

**MongoDB URI**: ___________________________

**Deployed On**: ___________________________

**Last Updated**: ___________________________

---

## ✅ Deployment Complete!

Congratulations! Your MERN chat app is now live on the web! 🎉

Share your frontend URL with friends and start chatting!
