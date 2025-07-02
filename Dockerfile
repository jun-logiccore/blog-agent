# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies for native modules (if any)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the TypeScript application
RUN npm run build

# Create posts directory
RUN mkdir -p /app/posts

# Set environment variables
ENV NODE_ENV=production

# Expose any ports if needed (though this appears to be a CLI tool)
# EXPOSE 3000

# Set the entrypoint to run the compiled JavaScript
ENTRYPOINT ["node", "dist/index.js"]

# Default command (can be overridden)
CMD ["--help"] 