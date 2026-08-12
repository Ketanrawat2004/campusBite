FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./

# ─── Development target ───────────────────────────────────────────
FROM base AS development
RUN npm install
COPY . .
EXPOSE 4001
CMD ["npm", "run", "dev"]

# ─── Production target ────────────────────────────────────────────
FROM base AS production
RUN npm ci --only=production && npm cache clean --force
COPY . .
# Non-root user for security
RUN addgroup -S campusbite && adduser -S campusbite -G campusbite
USER campusbite
EXPOSE 4001
CMD ["node", "src/server.js"]
