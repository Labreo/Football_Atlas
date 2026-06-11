FROM node:18-alpine AS builder
WORKDIR /app

# Install deps
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build (if there is a build step; keep simple for runtime TS via ts-node or compiled dist)
RUN npm run build || true

FROM node:18-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy production deps
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

EXPOSE 3001

CMD ["node", "dist/server.js"]
