FROM node:18-alpine AS builder
WORKDIR /app

# Copy backend package files and shared bundle.
COPY backend/package.json backend/shared.tgz ./
RUN npm install

# Copy source
COPY backend/. .

RUN npm run build
RUN npm prune --production

FROM node:18-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/data ./data

EXPOSE 3001

CMD ["node", "dist/server.js"]
