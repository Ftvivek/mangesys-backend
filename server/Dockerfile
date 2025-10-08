# Stage 1: Use an official Node.js runtime as a parent image
# Using Alpine Linux variant for smaller image size
FROM node:18-alpine AS base

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
# Copying these first leverages Docker cache if dependencies haven't changed
COPY package*.json ./

# Install only production dependencies
RUN npm install --production --ignore-scripts --prefer-offline

# Copy the rest of the backend source code into the container
# This respects the .dockerignore file in the server directory
COPY . .

# --- Add this section to include the built React frontend ---
# Create a directory to hold the frontend build
WORKDIR /app/frontend_build
# Copy the contents of the /build folder (created by npm run build)
# from the host machine's root directory into this new directory
# IMPORTANT: This path is relative TO THE BUILD CONTEXT (root folder)!
COPY ../build .
# Go back to the main app directory
WORKDIR /app
# --- End of frontend section ---

# Make port 5000 available to the world outside this container (adjust if your app uses a different port)
# This should match the port your server.js listens on
EXPOSE 5000

# Define the command to run your app using NodeJS
# This runs server.js when the container launches
CMD [ "node", "server.js" ]