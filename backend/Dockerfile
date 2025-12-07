# -------- build stage (has dev deps for tsc) ----------
FROM node:22-alpine AS build

WORKDIR /app

# copy package files first for better build cache
COPY package.json package-lock.json* ./

# install dev deps so tsc is available
RUN npm ci --include=dev

# copy source and tsconfig
COPY tsconfig.json ./
COPY src ./src

# run build (must succeed here)
RUN npm run build

# -------- production stage (small runtime image) -------
FROM node:22-alpine AS runtime

WORKDIR /app

# set NODE_ENV to production and install only prod deps
ENV NODE_ENV=production

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# copy compiled output from build stage
COPY --from=build /app/dist ./dist

EXPOSE 5000

# final start command (adjust if your entrypoint differs)
CMD ["node", "dist/server.js"]
