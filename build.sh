#!/bin/bash

# Prompt Boost Extension - Build Script
# This script builds the extension and provides helpful feedback

set -e  # Exit on any error

echo "🚀 Building Prompt Boost Extension..."
echo "================================================"

# Change to project directory
cd "$(dirname "$0")"

# Run the build command
echo "📦 Running build process..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build completed successfully!"
    echo ""
    echo "🔧 Next steps:"
    echo "1. Go to chrome://extensions/"
    echo "2. Click 'Reload' on the Prompt Boost extension"
    echo "3. Test your changes"
    echo ""
else
    echo ""
    echo "❌ Build failed! Check the errors above."
    exit 1
fi
