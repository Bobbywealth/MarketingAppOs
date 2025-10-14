# Use Node.js 20
FROM node:20-alpine

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
# Set a dummy DATABASE_URL for build time if not provided
ENV DATABASE_URL=${DATABASE_URL:-postgresql://dummy:dummy@localhost/dummy}
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Expose port
EXPOSE 5000

# Set to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "dist/index.js"]

