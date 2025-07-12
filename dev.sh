#!/bin/bash

# Prompt Boost Extension - Development Helper
# This script provides common development tasks

set -e

cd "$(dirname "$0")"

case "$1" in
    "build")
        echo "🚀 Building extension..."
        npm run build
        ;;
    "watch")
        echo "👀 Starting file watcher..."
        ./watch.sh
        ;;
    "reload")
        echo "🔄 Building and providing reload instructions..."
        npm run build
        echo ""
        echo "🌐 To reload extension:"
        echo "1. Open chrome://extensions/"
        echo "2. Find 'Prompt Boost' extension"
        echo "3. Click the reload button (🔄)"
        echo ""
        echo "💡 Or use this AppleScript command:"
        echo "osascript -e 'tell application \"Google Chrome\" to reload active tab of front window'"
        ;;
    "dev")
        echo "🔧 Starting development mode..."
        echo "This will:"
        echo "1. Build the extension"
        echo "2. Start watching for changes"
        echo ""
        ./build.sh
        echo "Starting watcher..."
        ./watch.sh
        ;;
    "clean")
        echo "🧹 Cleaning build artifacts..."
        # Add any cleanup commands here if needed
        echo "✅ Clean completed"
        ;;
    "help"|*)
        echo "Prompt Boost Extension - Development Helper"
        echo "=========================================="
        echo ""
        echo "Usage: ./dev.sh [command]"
        echo ""
        echo "Commands:"
        echo "  build   - Build the extension once"
        echo "  watch   - Watch for file changes and auto-rebuild"
        echo "  reload  - Build and show reload instructions"
        echo "  dev     - Start development mode (build + watch)"
        echo "  clean   - Clean build artifacts"
        echo "  help    - Show this help message"
        echo ""
        echo "Quick start:"
        echo "  ./dev.sh dev    - Start development with auto-rebuild"
        echo "  ./dev.sh build  - Build once"
        echo ""
        ;;
esac
