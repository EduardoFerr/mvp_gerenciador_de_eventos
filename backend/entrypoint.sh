#!/bin/bash
set -e


echo "PostgreSQL está pronto!"

if [ "$NODE_ENV" = "production" ]; then
  echo "🟢 Ambiente produção detectado: aplicando migrações..."
  npx prisma migrate deploy
else
  echo "🔧 Ambiente dev detectado: aplicando/criando migrações..."
  npx prisma migrate dev --name init --skip-seed
fi

if [ "$SEED_DB" = "true" ]; then
  echo "🌱 Executando seed do Prisma..."
  npx prisma db seed
else
  echo "⏭️ Seed ignorado (SEED_DB != true)."
fi

echo "🚀 Iniciando a aplicação..."
npm run start
