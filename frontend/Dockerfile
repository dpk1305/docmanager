FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN npm ci || npm install

FROM deps AS build
COPY . .
RUN npm run build

FROM node:22-alpine AS serve
WORKDIR /app
COPY --from=build /app/dist /app/dist
CMD ["node", "-e", "console.log('Built assets ready')"]
