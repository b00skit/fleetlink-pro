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

# This command will now succeed because the 'RUN mkdir -p public' command
# in the previous stage guarantees the folder exists.
COPY --from=builder /app/public ./public

# This command will fail if the build didn't produce a 'standalone' output.
# Make sure your next.config.js has "output: 'standalone'".
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Expose the port the app runs on
EXPOSE 3000

# Set the user to run the app
USER nextjs

# Start the app
CMD ["node", "server.js"]
