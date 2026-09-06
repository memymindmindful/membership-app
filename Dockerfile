# Multi-stage Dockerfile for Me.My.Mind Membership App
# Stage 1: Build stage
FROM node:20-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install --build-from-source
COPY . .
RUN npm run build

# Stage 2: Production runtime stage
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install --only=production --build-from-source
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server/schema.sql ./server/schema.sql
RUN mkdir -p /app/data
EXPOSE 3000
CMD ["node", "dist/server.cjs"]
