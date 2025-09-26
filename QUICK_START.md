# 🚀 Quick Start Guide

## One-Click Setup & Launch

This BeReal Clone includes automated setup scripts that handle all dependencies and configuration for you.

### For macOS/Linux:
```bash
./run.sh
```

### For Windows:
```batch
launch.bat
```

## What These Scripts Do:

✅ **Check System Requirements**
- Verify Node.js and npm are installed
- Display helpful error messages if requirements are missing

✅ **Install Dependencies**
- Automatically run `npm install` if needed
- Skip installation if dependencies are already up to date

✅ **Configure Development Environment**
- Check for Expo CLI (global or via npx)
- Clear Expo cache for a fresh start
- Handle common setup issues automatically

✅ **Start Development Server**
- Launch Expo development server
- Display QR code for mobile testing
- Provide clear instructions for next steps

## Requirements:
- **Node.js 18.x or later** (download from [nodejs.org](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Expo Go app** on your mobile device:
  - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
  - Android: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

## First Time Setup:
1. Run the appropriate script for your operating system
2. Install Expo Go on your mobile device
3. Scan the QR code that appears
4. The app will open automatically in Expo Go

## Troubleshooting:
- If the script fails, it will show specific error messages
- Make sure Node.js 18+ is installed
- Ensure you have an internet connection for dependency installation
- Close any other Expo development servers if you see port conflicts

## Manual Start (Alternative):
If you prefer to run commands manually:
```bash
npm install
npx expo start
```

---
*The automated scripts provide a better experience with error checking and helpful guidance!*
