FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci --only=production=false

# Copy source and generate Prisma client / compile TypeScript
COPY . .
RUN npx prisma generate && npm run build

# ─── Production image ─────────────────────────────────────────────────────────
FROM node:20-alpine AS production

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy only production node_modules and compiled output
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev

# Copy compiled backend and Prisma schema
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Ensure uploads directory exists and is writable by appuser
RUN mkdir -p uploads/resumes && chown -R appuser:appgroup uploads

# Switch to non-root
USER appuser

EXPOSE 5000

# Healthcheck — uses the liveness endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/v1/health || exit 1

CMD ["node", "dist/server.js"]
