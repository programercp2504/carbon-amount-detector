# Step 1: Base Image
FROM node:18-alpine

# Set secure production environment
ENV NODE_ENV=production
ENV PORT=8080

# Create application directory
WORKDIR /usr/src/app

# Copy package config first to leverage Docker cache
COPY package*.json ./

# Install only production dependencies (clean install, secure, and fast)
RUN npm ci --only=production

# Copy application source code
COPY src/ ./src/

# Change ownership to the non-root node user for security
RUN chown -R node:node /usr/src/app

# Run as a non-privileged user to mitigate runtime vulnerabilities
USER node

# Expose the port (Cloud Run will override this using the PORT env var)
EXPOSE 8080

# Start the application
CMD [ "npm", "start" ]
