#!/bin/bash

# Prompt Boost Extension - Watch Script
# This script watches for file changes and automatically rebuilds

set -e

echo "👀 Starting Prompt Boost Extension watcher..."
echo "================================================"
echo "Watching for changes in src/, manifest.json, and icons/"
echo "Press Ctrl+C to stop"
echo ""

# Change to project directory
cd "$(dirname "$0")"

# Function to build the extension
build_extension() {
    echo "🔄 Change detected! Building..."
    npm run build
    if [ $? -eq 0 ]; then
        echo "✅ Build completed at $(date)"
        echo "🔧 Don't forget to reload the extension in Chrome!"
        echo ""
    else
        echo "❌ Build failed at $(date)"
        echo ""
    fi
}

# Initial build
build_extension

# Check if fswatch is available (macOS)
if command -v fswatch > /dev/null 2>&1; then
    echo "Using fswatch for file monitoring..."
    fswatch -o src/ manifest.json icons/ | while read f; do
        build_extension
    done
# Check if inotifywait is available (Linux)
elif command -v inotifywait > /dev/null 2>&1; then
    echo "Using inotifywait for file monitoring..."
    while true; do
        inotifywait -r -e modify,create,delete src/ manifest.json icons/ > /dev/null 2>&1
        build_extension
    done
else
    echo "⚠️  File watcher not available. Installing fswatch..."
    echo "Run: brew install fswatch (on macOS)"
    echo ""
    echo "Falling back to manual polling every 2 seconds..."
    
    # Simple polling fallback
    last_mod=""
    while true; do
        current_mod=$(find src/ manifest.json icons/ -type f -exec stat -f "%m" {} \; 2>/dev/null | sort -n | tail -1)
        if [ "$current_mod" != "$last_mod" ] && [ -n "$last_mod" ]; then
            build_extension
        fi
        last_mod="$current_mod"
        sleep 2
    done
fi
