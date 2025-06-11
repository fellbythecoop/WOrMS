# Multi-stage build for NestJS backend
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY apps/backend ./apps/backend

# Build the application
WORKDIR /app/apps/backend
RUN npm run build

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Create uploads directory
RUN mkdir -p uploads && chown nestjs:nodejs uploads
RUN mkdir -p logs && chown nestjs:nodejs logs

USER nestjs

EXPOSE 3001

ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["node", "dist/main"] 