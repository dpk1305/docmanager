FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN npm ci --omit=dev || npm install --omit=dev
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
EXPOSE 5000
CMD ["node", "dist/server.js"]

