# Use Node.js 20
FROM node:20-bullseye-slim

# Install build dependencies for native modules
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
# Use npm install instead of npm ci to properly resolve platform-specific
# native dependencies (like @rollup/rollup-linux-x64-gnu) for the Linux container
RUN npm install --include=optional

# Copy source code
COPY . .

# Build the application
# Set a dummy DATABASE_URL for build time if not provided
ENV DATABASE_URL=${DATABASE_URL:-postgresql://dummy:dummy@localhost/dummy}

# Run build steps separately to see which fails
RUN echo "Building client with Vite..." && npx vite build
RUN echo "Building server with esbuild..." && npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Keep all dependencies (including dev) since server imports from vite module
# Alternative would be to use dynamic imports, but this is simpler

# Expose port
EXPOSE 5000

# Set to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "dist/index.js"]
