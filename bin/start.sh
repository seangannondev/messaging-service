#!/bin/bash

set -e

echo "Starting the messaging service..."
echo "Environment: ${ENV:-development}"

# Check if Docker is running and start PostgreSQL
if ! docker-compose ps | grep -q "messaging-service-db.*Up"; then
    echo "Starting PostgreSQL database..."
    docker-compose up -d postgres
    
    # Wait for database to be ready
    echo "Waiting for database to be ready..."
    sleep 10
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the application
echo "Starting the messaging service API..."
npm start 