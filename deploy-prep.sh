#!/bin/bash

# MERN Chat App - Quick Deployment Script
# This script helps you prepare your app for deployment

echo "======================================"
echo "MERN Chat App - Deployment Preparation"
echo "======================================"
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "Initializing Git repository..."
    git init
    echo "Git repository initialized!"
else
    echo "Git repository already initialized."
fi

# Check for .env files
echo ""
echo "Checking environment files..."

if [ ! -f "client/.env" ]; then
    echo "⚠️  client/.env not found. Please create it from client/.env.example"
    echo "   Required variables: VITE_API_URL, VITE_GIPHY_API_KEY"
fi

if [ ! -f "server/.env" ]; then
    echo "⚠️  server/.env not found. Please create it from server/.env.example"
    echo "   Required variables: MONGODB_URI, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, etc."
fi

echo ""
echo "======================================"
echo "Next Steps:"
echo "======================================"
echo ""
echo "1. Setup MongoDB Atlas:"
echo "   - Visit: https://www.mongodb.com/cloud/atlas"
echo "   - Create free cluster and get connection string"
echo ""
echo "2. Setup Google OAuth:"
echo "   - Visit: https://console.cloud.google.com/"
echo "   - Create OAuth 2.0 credentials"
echo ""
echo "3. Get GIPHY API Key (optional):"
echo "   - Visit: https://developers.giphy.com/"
echo ""
echo "4. Push to GitHub:"
echo "   git add ."
echo "   git commit -m \"Prepare for deployment\""
echo "   git remote add origin YOUR_GITHUB_REPO_URL"
echo "   git push -u origin main"
echo ""
echo "5. Deploy on Render.com:"
echo "   - Visit: https://dashboard.render.com/"
echo "   - Create Blueprint (uses render.yaml)"
echo "   - Or create Web Service + Static Site manually"
echo ""
echo "For detailed instructions, see DEPLOYMENT.md"
echo ""
