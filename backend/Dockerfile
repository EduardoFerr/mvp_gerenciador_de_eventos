# Etapa 1: build
FROM node:20 AS build

WORKDIR /app

COPY package*.json ./

ARG BUILD_DATE=unknown

COPY . .

RUN npm install && npm run build

# Etapa 2: produção
FROM node:20-slim

WORKDIR /app

# Copia pacotes e Prisma
COPY --from=build /app/package*.json ./
COPY --from=build /app/prisma ./prisma

# Instala apenas as dependências de produção
RUN npm install --only=production && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
    openssl \
    postgresql-client \
    curl \
    gnupg \
    ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Script wait-for-it
RUN curl -sSL https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh -o /usr/bin/wait-for-it.sh && \
    chmod +x /usr/bin/wait-for-it.sh

# Copia o código buildado
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma/client ./node_modules/@prisma/client

EXPOSE 3001

CMD ["node", "dist/main.js"]
