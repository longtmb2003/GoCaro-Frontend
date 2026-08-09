# syntax=docker/dockerfile:1
FROM node:22-alpine AS builder
WORKDIR /app

ARG VITE_API_BASE_URL=""
ARG VITE_TURNSTILE_SITE_KEY=""
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_TURNSTILE_SITE_KEY=${VITE_TURNSTILE_SITE_KEY}

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
