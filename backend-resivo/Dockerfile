# Backend image, in two stages (multi-stage build):
#   1. build: installs ALL the dependencies, runs the tests and compiles TypeScript -> dist/
#   2. final: only the production dependencies + dist/ (no TypeScript, no tests, no dev tools)

# ---------- stage 1: build ----------
FROM node:26-alpine AS build
WORKDIR /app

# dependencies first: Docker reuses this layer while package*.json do not change
COPY package.json package-lock.json ./
RUN npm ci

# source code (.dockerignore leaves out node_modules, dist, .env, .git, ...)
COPY . .

# if a test fails, the image is not built
RUN npm test
RUN npm run build

# ---------- stage 2: final ----------
FROM node:26-alpine
WORKDIR /app
ENV NODE_ENV=production

# time zones: alpine does not bring them, so TZ would only work for Node and not for the
# rest of the container (Node has its own copy; this keeps both in the same time)
RUN apk add --no-cache tzdata

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# the compiled code comes from the "build" stage of THIS Dockerfile
COPY --from=build /app/dist ./dist

# do not run as root inside the container
USER node

# the configuration (DB_HOST, DB_USER, ...) is NOT copied into the image:
# docker-compose passes it when the container starts
EXPOSE 3000

# Docker asks GET / every 10 s: healthy when the API answers 200
# (uses the fetch of Node, so there is no need to install curl)
HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT || 3000) + '/').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/main.js"]
