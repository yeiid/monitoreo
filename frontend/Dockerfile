# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app

# Accept API and Map URLs as build arguments
ARG PUBLIC_API_URL
ARG PUBLIC_MAP_TILE_URL
ENV PUBLIC_API_URL=$PUBLIC_API_URL
ENV PUBLIC_MAP_TILE_URL=$PUBLIC_MAP_TILE_URL

COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
