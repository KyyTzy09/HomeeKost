# Step 1: Base image
FROM node:22-alpine AS base
WORKDIR /app

# Step 2: Dependencies stage
FROM base AS deps
COPY package.json bun.lock tsconfig.json ./
COPY prisma ./prisma/
RUN npx bun install --frozen-lockfile || npm install

# Step 3: Builder stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN npm run build

# Step 4: Runner stage
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["npm", "run", "start"]
