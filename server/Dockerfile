FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY prisma ./prisma
COPY scripts ./scripts
COPY src ./src

RUN npm run db:generate && npm run build

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "dist/src/index.js"]
