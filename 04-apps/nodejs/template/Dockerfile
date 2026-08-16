<!-- PURPOSE OF THIS FILE: Docker konteyner imajı — Node.js 20 Alpine ile minimal production imajı -->
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install --production

FROM node:20-alpine
WORKDIR /app
RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -s /bin/sh -D nodejs
COPY --from=builder /app/node_modules ./node_modules
COPY src/ ./src/
COPY data/ ./data/
USER nodejs
EXPOSE {{PORT}}
CMD ["node", "src/index.js"]
