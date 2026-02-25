# Use the full Node.js 20 image (Debian based)
FROM node:20

# Set working directory
WORKDIR /app

# Copy package.json first
COPY package.json ./

# Remove package-lock.json if it was copied and install dependencies
# This forces npm to resolve the correct native bindings for @tailwindcss/oxide
# specifically for the Linux environment inside the container.
RUN rm -f package-lock.json && npm install

# Copy the rest of the application
COPY . .

# Build the frontend
RUN npm run build

# Expose the port
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production

# Start the application
# We use npm start which now calls tsx server.ts
CMD ["npm", "start"]
