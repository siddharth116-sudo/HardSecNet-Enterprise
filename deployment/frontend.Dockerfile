
# ------------------------------------
# Stage 1: Build React App
# ------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY Dashboard/package.json Dashboard/package-lock.json ./Dashboard/

# Install dependencies (ci ensures clean install)
WORKDIR /app/Dashboard
RUN npm ci

# Copy source code
COPY Dashboard/ .

# Build production bundle
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# ------------------------------------
# Stage 2: Serve with Nginx
# ------------------------------------
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy build artifacts to nginx html directory
COPY --from=builder /app/Dashboard/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY deployment/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Expose ports
EXPOSE 80 443

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
