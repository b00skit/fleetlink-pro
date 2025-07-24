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

# --- TROUBLESHOOTING STEP ---
# The command below ensures the 'public' directory exists before the build runs.
# This will prevent the build from failing at the 'COPY ... /app/public' step later.
# If the build succeeds with this change, but your running application is missing
# images or styles, it confirms the problem is that your original 'public'
# folder is not being included in the Docker build context by Portainer.
RUN mkdir -p public

RUN npm run build

# Stage 3: Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user for security purposes
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from the builder stage
# The --chown flag ensures the new user owns the files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Expose the port the app runs on
EXPOSE 3000

# Set the user to run the app
USER nextjs

# Start the app
CMD ["node", "server.js"]
