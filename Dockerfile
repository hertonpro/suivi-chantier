# Utilisation de l'image Node.js complète (Debian)
FROM node:20

WORKDIR /app

# On ne copie que le package.json
COPY package.json ./

# On force une installation propre pour Linux
RUN rm -rf node_modules package-lock.json && npm install --force

# On copie le reste
COPY . .

# Build du frontend
RUN npm run build

# Port et Env
EXPOSE 3000
ENV NODE_ENV=production

# Démarrage
CMD ["npm", "start"]
