FROM node:18-alpine AS builder
WORKDIR /app

# Copy backend package files and shared bundle.
COPY package.json package-lock.json shared.tgz ./
RUN npm ci

# Copy source
COPY . .

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
