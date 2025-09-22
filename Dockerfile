# Docker Configuration for Production Deployment
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies for both backend and frontend
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install backend dependencies
WORKDIR /usr/src/app/backend
RUN npm ci --only=production

# Install frontend dependencies and build
WORKDIR /usr/src/app/frontend  
RUN npm ci
COPY frontend/ .
RUN npm run build

# Copy backend source
WORKDIR /usr/src/app/backend
COPY backend/ .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S websphere -u 1001

# Create logs directory with proper permissions
RUN mkdir -p logs uploads
RUN chown -R websphere:nodejs logs uploads

# Switch to non-root user
USER websphere

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["npm", "start"]