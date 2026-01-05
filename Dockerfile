# Build stage for client
FROM node:20-alpine AS client-builder

WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Copy server package files and install dependencies
COPY server/package*.json ./
RUN npm ci --only=production

# Rebuild better-sqlite3 for Alpine
RUN npm rebuild better-sqlite3

# Copy server source
COPY server/src ./src

# Copy built client
COPY --from=client-builder /app/client/dist ./public

# Create storage directory
RUN mkdir -p storage/images

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start server
CMD ["node", "src/index.js"]
