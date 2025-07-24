# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker cache
COPY package.json package-lock.json ./
RUN npm install

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create data directory and initial json files
# These files will be owned by root in this stage, which is fine
RUN mkdir -p /app/public/data && \
    echo '{"assignments":[],"vehicles":[]}' > /app/public/data/fleetData.json && \
    echo '{}' > /app/public/data/syncStatus.json

RUN npm run build

# Stage 3: Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user for security purposes
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# --- THIS IS THE FIX ---
# Copy the public directory and change its ownership to the new user
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# ----------------------

# Copy other necessary files from the builder stage, ensuring correct ownership
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Expose the port the app runs on
EXPOSE 3000

# Set the user to run the app
USER nextjs

# Start the app
# The command should point to the server file within the standalone output
CMD ["node", "server.js"]
