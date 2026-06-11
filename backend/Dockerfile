FROM node:18-alpine AS builder
WORKDIR /app

# Copy workspace manifests so npm can resolve shared workspace packages.
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY backend/tsconfig.json ./backend/tsconfig.json
COPY shared ./shared
COPY backend/src ./backend/src

# Install backend workspace dependencies and build.
RUN npm ci --workspace backend
WORKDIR /app/backend
RUN npm run build
RUN npm prune --production

FROM node:18-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/package.json ./package.json

EXPOSE 3001

CMD ["node", "dist/server.js"]
