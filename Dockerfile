# Multi-stage Dockerfile for Me.My.Mind Membership App

# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Build Vite client assets and esbuild server bundle
RUN npm run build

# Stage 2: Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy compiled build output from builder stage
COPY --from=builder /app/dist ./dist

# Ensure persistent data directory exists
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
