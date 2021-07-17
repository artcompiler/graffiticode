# syntax=docker/dockerfile:1

FROM node:alpine AS builder
ENV NODE_ENV=production

WORKDIR /workspace

# Install build dependencies
COPY ["package.json", "package-lock.json*", "./"]
RUN npm ci

# Build static files
COPY . .
RUN npm run build

# Install production dependencies
RUN npm ci --production

CMD ["node", "app.js"]
