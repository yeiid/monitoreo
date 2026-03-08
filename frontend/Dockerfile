# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app

# Accept API and Map URLs as build arguments
ARG PUBLIC_API_URL
ARG PUBLIC_MAP_TILE_URL

# Set environment variables for the build process
ENV PUBLIC_API_URL=$PUBLIC_API_URL
ENV PUBLIC_MAP_TILE_URL=$PUBLIC_MAP_TILE_URL

# Copy package files first to leverage Docker cache
COPY frontend/package*.json ./
RUN npm install

# Copy the rest of the frontend source
COPY frontend/ .

# Build the application
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Clean the default nginx public folder
RUN rm -rf ./*

# Copy built assets from the build stage
COPY --from=build /app/dist .

# Copy custom nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# For production, we don't need a heavy CMD, alpine's default is fine
CMD ["nginx", "-g", "daemon off;"]
