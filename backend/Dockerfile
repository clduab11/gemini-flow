# =============================================================================
# Stage 1: Builder - Install dependencies and prepare application
# =============================================================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install ALL dependencies (including devDependencies for potential build steps)
RUN npm ci && npm cache clean --force

# Copy application source
COPY . .

# Remove development dependencies
RUN npm prune --production

# =============================================================================
# Stage 2: Production - Minimal runtime image
# =============================================================================
FROM node:18-alpine

# Install dumb-init to handle PID 1 responsibilities
RUN apk add --no-cache dumb-init

# Create non-root user and group
RUN addgroup -g 1001 -S nodejs && \
    adduser -S geminiflow -u 1001 -G nodejs

WORKDIR /app

# Create data directory with correct permissions
RUN mkdir -p .data logs && \
    chown -R geminiflow:nodejs .data logs

# Copy dependencies from builder stage
COPY --from=builder --chown=geminiflow:nodejs /app/node_modules ./node_modules

# Copy application code with correct ownership
COPY --chown=geminiflow:nodejs package*.json ./
COPY --chown=geminiflow:nodejs src ./src

# Switch to non-root user
USER geminiflow

# Expose port
EXPOSE 3001

# Health check (runs as non-root user)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start server
CMD ["node", "src/server.js"]

# Metadata
LABEL org.opencontainers.image.title="Gemini Flow Backend" \
      org.opencontainers.image.description="Backend API and WebSocket server for Gemini Flow" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.vendor="Gemini Flow" \
      org.opencontainers.image.source="https://github.com/clduab11/gemini-flow" \
      maintainer="clduab11"
