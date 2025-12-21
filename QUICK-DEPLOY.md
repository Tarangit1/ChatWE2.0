# Quick Deployment Guide

## 🚀 Deploy in 5 Minutes

### Prerequisites Checklist
- [ ] MongoDB Atlas account (free)
- [ ] Google Cloud Console account
- [ ] GitHub account
- [ ] Render.com account (free)
- [ ] GIPHY API key (optional)

---

## Step 1: Database Setup (2 min)

1. **MongoDB Atlas**: https://www.mongodb.com/cloud/atlas
   - Click "Build a Database" → "Free" tier
   - Create cluster (AWS, closest region)
   - Create database user
   - Click "Connect" → "Drivers" → Copy connection string
   - Example: `mongodb+srv://user:<password>@cluster0.xxxxx.mongodb.net/chatapp`

2. **Important**: Network Access
   - Click "Network Access" → "Add IP Address" → "Allow Access from Anywhere" (`0.0.0.0/0`)

---

## Step 2: Google OAuth Setup (2 min)

1. **Google Cloud Console**: https://console.cloud.google.com/
   - Create/Select project
   - APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
   - Application type: Web application
   - **After deployment**, add these authorized redirect URIs:
     - `https://YOUR-BACKEND-URL.onrender.com/auth/google/callback`
   - Save Client ID and Client Secret

---

## Step 3: Push to GitHub (1 min)

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

---

## Step 4: Deploy on Render (Auto-Deploy)

### 🎯 Recommended: One-Click Blueprint Deploy

1. Go to https://dashboard.render.com/
2. Click **"New"** → **"Blueprint"**
3. Connect your GitHub repo
4. Render will detect `render.yaml` automatically
5. Enter environment variables:

**Backend Environment Variables:**
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/chatapp
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLIENT_URL=https://mern-chat-frontend.onrender.com
SESSION_SECRET=auto-generated
```

**Frontend Environment Variables:**
```
VITE_API_URL=https://mern-chat-backend.onrender.com
VITE_GIPHY_API_KEY=your_giphy_key_optional
```

6. Click **"Apply"** - Both services will deploy!

⏱️ First deployment takes ~5-10 minutes

---

## Step 5: Final Configuration

### Update Google OAuth (After deployment URLs are available)

1. Go back to Google Cloud Console
2. Edit OAuth Client
3. Add authorized redirect URI:
   - `https://YOUR-ACTUAL-BACKEND-URL.onrender.com/auth/google/callback`

### Update Render Environment Variables

1. **Backend service** → Environment:
   - Update `CLIENT_URL` to actual frontend URL
   
2. **Frontend service** → Environment:
   - Update `VITE_API_URL` to actual backend URL

3. **Redeploy** both services (click "Manual Deploy")

---

## ✅ Done! Test Your App

1. Visit your frontend URL: `https://YOUR-APP.onrender.com`
2. Click "Login with Google"
3. Start chatting!

---

## 📋 Deployment URLs Reference

After deployment, you'll have:
- **Frontend**: `https://mern-chat-frontend.onrender.com`
- **Backend**: `https://mern-chat-backend.onrender.com`

Save these URLs and update them in:
- ✅ Google OAuth redirect URI
- ✅ Render environment variables (CLIENT_URL, VITE_API_URL)

---

## ⚠️ Important Notes

### Free Tier Limitations
- Services sleep after 15 min of inactivity
- First load after sleep takes ~30-60 seconds
- File uploads are temporary (lost on restart)

### For Production
- Upgrade to paid tier ($7/month per service)
- Use cloud storage (AWS S3) for file uploads
- Consider MongoDB Atlas paid tier for more storage

---

## 🐛 Troubleshooting

**Login not working?**
- Check Google OAuth redirect URI matches exactly
- Verify environment variables are correct
- Check browser console for errors

**Can't connect?**
- MongoDB: Check network access allows `0.0.0.0/0`
- Check Render logs for errors

**504 Timeout?**
- Free tier is spinning up, wait 60 seconds and retry

---

## Alternative: Manual Deployment

If Blueprint doesn't work, deploy manually:

### Backend Web Service
1. New → Web Service
2. Connect GitHub repo
3. Root Directory: `server`
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Add environment variables
7. Create Web Service

### Frontend Static Site
1. New → Static Site
2. Connect GitHub repo
3. Root Directory: `client`
4. Build Command: `npm install && npm run build`
5. Publish Directory: `dist`
6. Add environment variables
7. Create Static Site

---

## 💡 Pro Tips

1. **Custom Domain**: Add in Render settings (free on paid plans)
2. **Monitoring**: Check Render logs regularly
3. **Backups**: MongoDB Atlas has automatic backups
4. **SSL**: Provided automatically by Render
5. **Updates**: Just push to GitHub, auto-deploys!

---

**Need detailed instructions?** See `DEPLOYMENT.md`

**Having issues?** Check Render logs and MongoDB Atlas monitoring
