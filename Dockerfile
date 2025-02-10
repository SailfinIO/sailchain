# ============================
# Stage 1: Build the application
# ============================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /appgst

# Copy package files first to leverage Docker cache for dependency installation
COPY package*.json ./

# Install all dependencies (dev dependencies are needed for building)
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the project (this runs "nest build" and creates the "dist" directory)
RUN npm run build

# ============================
# Stage 2: Create the production image
# ============================
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files to install only production dependencies
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy the built application from the builder stage
COPY --from=builder /app/dist ./dist

# Set environment variable to production
ENV NODE_ENV=production

# Expose the port the application listens on
EXPOSE 80

# Start the application
CMD ["node", "dist/main"]
