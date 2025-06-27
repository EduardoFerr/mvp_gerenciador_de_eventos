#!/bin/bash
set -e

DB_HOST="db"
DB_PORT="5432"
DB_USER="user"

wait_for_postgres() {
  echo "Aguardando o PostgreSQL iniciar em $DB_HOST:$DB_PORT..."
  until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; do
    echo "PostgreSQL ainda não está pronto. Tentando novamente em 1 segundo..."
    sleep 1
  done
  echo "PostgreSQL está pronto e aceitando conexões!"
}

wait_for_postgres

if [ "$NODE_ENV" = "production" ]; then
  echo "🟢 Ambiente de produção detectado: aplicando migrações..."
  npx prisma migrate deploy
else
  echo "🔧 Ambiente de desenvolvimento detectado: aplicando ou criando migrações..."
  npx prisma migrate dev --name init
fi

if [ "$SEED_DB" = "true" ]; then
  echo "🌱 Executando o seed do Prisma..."
  npm run prisma:seed
else
  echo "⏭️  Seed ignorado (SEED_DB != true)."
fi

echo "🚀 Iniciando a aplicação backend..."
npm run start
