#!/bin/bash

# Clean the dist directory
echo "Cleaning dist directory..."
rm -rf dist
mkdir -p dist

# Start the build process in watch mode
echo "Starting build process in watch mode..."
node build.mjs --dev &
BUILD_PID=$!

# Wait a moment for the build to start
sleep 2

# Start web-ext (using a single string command)
echo "Starting web-ext..."
bun run web-ext &
WEBEXT_PID=$!

# Function to clean up processes on exit
cleanup() {
  echo "Stopping development server..."
  kill $BUILD_PID $WEBEXT_PID 2>/dev/null
  exit 0
}

# Set up trap to catch Ctrl+C and other termination signals
trap cleanup SIGINT SIGTERM

echo "Development server started. Press Ctrl+C to stop."

# Keep the script running until Ctrl+C is pressed
wait