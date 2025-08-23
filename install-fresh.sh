#!/bin/bash

# Fresh Install Script for DTM Project
# This script helps resolve icon compatibility issues on new computers

echo "🔧 DTM Project - Fresh Install Script"
echo "====================================="
echo ""

# Check Node.js version
echo "📋 Checking Node.js version..."
NODE_VERSION=$(node --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Node.js version: $NODE_VERSION"
else
    echo "❌ Node.js not found. Please install Node.js 16+ first."
    exit 1
fi

# Check npm version
echo "📋 Checking npm version..."
NPM_VERSION=$(npm --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ npm version: $NPM_VERSION"
else
    echo "❌ npm not found. Please install npm 8+ first."
    exit 1
fi

# Check pnpm
echo "📋 Checking pnpm..."
PNPM_VERSION=$(pnpm --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ pnpm version: $PNPM_VERSION"
    USE_PNPM=true
else
    echo "⚠️  pnpm not found, will use npm instead"
    USE_PNPM=false
fi

echo ""
echo "🧹 Cleaning up existing installation..."

# Remove existing files
rm -rf node_modules
rm -f package-lock.json
rm -f pnpm-lock.yaml

# Clear npm cache
echo "🗑️  Clearing npm cache..."
npm cache clean --force

echo ""
echo "📦 Installing dependencies..."

# Install dependencies
if [ "$USE_PNPM" = true ]; then
    echo "Using pnpm..."
    pnpm install
else
    echo "Using npm..."
    npm install
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Installation completed successfully!"
    echo ""
    echo "🚀 To start the development server:"
    if [ "$USE_PNPM" = true ]; then
        echo "   pnpm run dev"
    else
        echo "   npm run dev"
    fi
    echo ""
    echo "🔧 If you still encounter icon issues, try:"
    echo "   1. Update lucide-react: npm install lucide-react@latest"
    echo "   2. Check the ICON_COMPATIBILITY_FIX.md file for more details"
else
    echo ""
    echo "❌ Installation failed. Please check the error messages above."
    echo "💡 Try updating your Node.js and npm versions."
    exit 1
fi
