FROM node:20

WORKDIR /app

COPY . .

RUN npm ci
RUN npm run build
RUN npx prisma generate

ENV NODE_ENV=production

RUN chmod +x entrypoint.sh

ENTRYPOINT ["sh", "./entrypoint.sh"]
