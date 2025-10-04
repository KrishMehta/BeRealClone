#!/bin/bash

# BeReal Clone - One-Click Setup, Test & Launch Script
# This script will automatically set up, run tests, and launch the BeReal Clone app

set -e  # Exit on any error

echo "🎬 BeReal Clone - Automated Setup, Test & Launch"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
print_status "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed!"
    print_status "Please install Node.js from https://nodejs.org/"
    print_status "Recommended version: Node.js 18.x or later"
    exit 1
fi

NODE_VERSION=$(node --version)
print_success "Node.js is installed: $NODE_VERSION"

# Check if npm is installed
print_status "Checking npm installation..."
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed!"
    exit 1
fi

NPM_VERSION=$(npm --version)
print_success "npm is installed: $NPM_VERSION"

# Navigate to the project directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

print_status "Working directory: $SCRIPT_DIR"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found! Make sure you're in the BeReal Clone project directory."
    exit 1
fi

print_success "Found package.json"

# Install dependencies
print_status "Installing project dependencies..."
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    print_status "Running npm install..."
    if npm install; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
else
    print_success "Dependencies already installed and up to date"
fi

# Run the test suite
print_status "Running automated test suite..."
print_status "This will run all tests to ensure the app is working correctly"
echo ""

# Run tests with npm test command
if npm test -- --passWithNoTests --watchAll=false; then
    print_success "All tests passed successfully!"
    echo ""
else
    print_error "Tests failed! Please fix the failing tests before proceeding."
    print_status "You can run 'npm test' manually to see detailed test output"
    exit 1
fi

# Check if Expo CLI is available
print_status "Checking Expo CLI..."
if ! command -v expo &> /dev/null; then
    if ! command -v npx &> /dev/null; then
        print_error "Neither expo CLI nor npx is available!"
        exit 1
    fi
    print_warning "Expo CLI not found globally, will use npx expo"
    EXPO_CMD="npx expo"
else
    print_success "Expo CLI is available"
    EXPO_CMD="expo"
fi

# Clear Expo cache (optional, helps with issues)
print_status "Clearing Expo cache for fresh start..."
# Clear watchman watches
if command -v watchman &> /dev/null; then
    watchman watch-del-all > /dev/null 2>&1 || true
fi
# Remove Metro bundler cache
rm -rf "$TMPDIR/metro-cache" > /dev/null 2>&1 || true
# Remove Haste map cache  
find "$TMPDIR" -name "haste-map-*" -type d -exec rm -rf {} + > /dev/null 2>&1 || true

print_success "Setup completed successfully!"
echo ""
echo "🚀 Starting BeReal Clone Development Server..."
echo "=============================================="
echo ""
print_status "The app will start in development mode"
print_status "A QR code will appear - scan it with your iPhone camera"
print_status "Make sure you have the 'Expo Go' app installed from the App Store"
echo ""
print_warning "To stop the server, press Ctrl+C"
echo ""

# Start the Expo development server
print_status "Launching Expo development server..."

# Start the development server
if $EXPO_CMD start; then
    print_success "Development server started successfully!"
else
    print_error "Failed to start development server"
    print_status "Try running manually: $EXPO_CMD start"
    exit 1
fi
