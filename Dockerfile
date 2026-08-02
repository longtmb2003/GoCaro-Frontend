# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency definitions
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

FROM nginx:alpine
# Override default config with SPA fallback + cache policy
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy built static files to Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
