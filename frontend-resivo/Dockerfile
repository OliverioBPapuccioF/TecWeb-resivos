# Frontend image, in two stages (multi-stage build):
#   1. build: installs the dependencies and compiles Angular -> dist/frontend-resivo/browser
#   2. final: only nginx serving those static files (no Node, no node_modules)
#
# The Angular code runs in the BROWSER: this container only serves files.
# The browser calls the API directly (environment.apiUrl), so no proxy is needed.

# ---------- stage 1: build ----------
FROM node:26-alpine AS build
WORKDIR /app

# dependencies first: Docker reuses this layer while package*.json do not change
COPY package.json package-lock.json ./
RUN npm ci

# source code (.dockerignore leaves out node_modules, dist, .angular, ...)
COPY . .
RUN npx ng build

# ---------- stage 2: final ----------
FROM nginx:1.30-alpine

# our nginx configuration: every route of the app answers index.html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# the compiled app comes from the "build" stage of THIS Dockerfile
COPY --from=build /app/dist/frontend-resivo/browser /usr/share/nginx/html

EXPOSE 80

# healthy when nginx answers the home page (wget comes with alpine)
HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://localhost/ || exit 1
