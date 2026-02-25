# Use Node.js 20 as the base image
FROM node:20-slim

# Set the working directory
WORKDIR /app

# Copy package files and install all dependencies
# (Removing better-sqlite3 from package.json already fixed the build error)
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the frontend static files
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]
