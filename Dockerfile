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

# --- DEBUGGING STEP ---
# This command will list all files and folders that have been copied.
# If you don't see the 'public' folder in the output, your .dockerignore file is the problem.
RUN echo "--- Listing files in the build context ---" && ls -R

RUN npm run build

# Stage 3: Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# This command will fail if the 'public' folder was not present in the 'builder' stage.
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
