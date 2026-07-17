FROM node:24-alpine AS base

WORKDIR /app

RUN corepack enable


# Dependencias y ejecución para desarrollo
FROM base AS development

COPY package.json pnpm-workspace.yaml ./

RUN pnpm install

COPY . .

EXPOSE 3000

CMD ["pnpm", "start:dev"]


# Compilación del proyecto
FROM base AS build

COPY package.json pnpm-workspace.yaml ./

RUN pnpm install

COPY . .

RUN pnpm build


# Dependencias exclusivas de producción
FROM base AS production-dependencies

COPY package.json pnpm-workspace.yaml ./

RUN pnpm install --prod


# Imagen final de producción
FROM node:24-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=production-dependencies \
  --chown=node:node \
  /app/node_modules \
  ./node_modules

COPY --from=build \
  --chown=node:node \
  /app/dist \
  ./dist

COPY --chown=node:node package.json ./

USER node

EXPOSE 3100

CMD ["node", "dist/main.js"]
