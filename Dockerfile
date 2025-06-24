# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --only=production && npm cache clean --force

# Production stage
FROM node:18-alpine AS runtime

WORKDIR /app

# Copy production dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY server.js ./
COPY public ./public

# Create assets mount point
RUN mkdir -p /app/assets

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
