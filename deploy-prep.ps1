# MERN Chat App - Quick Deployment Script (Windows)
# This script helps you prepare your app for deployment

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "MERN Chat App - Deployment Preparation" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if git is initialized
if (-not (Test-Path .git)) {
    Write-Host "Initializing Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "Git repository initialized!" -ForegroundColor Green
} else {
    Write-Host "Git repository already initialized." -ForegroundColor Green
}

# Check for .env files
Write-Host ""
Write-Host "Checking environment files..." -ForegroundColor Yellow

if (-not (Test-Path "client\.env")) {
    Write-Host "⚠️  client\.env not found. Please create it from client\.env.example" -ForegroundColor Red
    Write-Host "   Required variables: VITE_API_URL, VITE_GIPHY_API_KEY" -ForegroundColor Gray
}

if (-not (Test-Path "server\.env")) {
    Write-Host "⚠️  server\.env not found. Please create it from server\.env.example" -ForegroundColor Red
    Write-Host "   Required variables: MONGODB_URI, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, etc." -ForegroundColor Gray
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Setup MongoDB Atlas:" -ForegroundColor Yellow
Write-Host "   - Visit: https://www.mongodb.com/cloud/atlas"
Write-Host "   - Create free cluster and get connection string"
Write-Host ""
Write-Host "2. Setup Google OAuth:" -ForegroundColor Yellow
Write-Host "   - Visit: https://console.cloud.google.com/"
Write-Host "   - Create OAuth 2.0 credentials"
Write-Host ""
Write-Host "3. Get GIPHY API Key (optional):" -ForegroundColor Yellow
Write-Host "   - Visit: https://developers.giphy.com/"
Write-Host ""
Write-Host "4. Push to GitHub:" -ForegroundColor Yellow
Write-Host "   git add ." -ForegroundColor Gray
Write-Host "   git commit -m 'Prepare for deployment'" -ForegroundColor Gray
Write-Host "   git remote add origin YOUR_GITHUB_REPO_URL" -ForegroundColor Gray
Write-Host "   git push -u origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Deploy on Render.com:" -ForegroundColor Yellow
Write-Host "   - Visit: https://dashboard.render.com/"
Write-Host "   - Create Blueprint (uses render.yaml)"
Write-Host "   - Or create Web Service + Static Site manually"
Write-Host ""
Write-Host "For detailed instructions, see DEPLOYMENT.md" -ForegroundColor Cyan
Write-Host ""

# Pause to let user read
Read-Host -Prompt "Press Enter to continue"
