# frontend/Dockerfile
# Dockerfile para construir a imagem da aplicação frontend (React/Next.js).

# Usa a imagem base oficial do Node.js LTS (Long Term Support).
# A versão slim é mais leve e adequada para produção.
FROM node:20-alpine AS builder

# Define o diretório de trabalho dentro do contêiner.
WORKDIR /app

# Copia os arquivos package.json e package-lock.json para o diretório de trabalho.
COPY package*.json ./

# Instala as dependências do Node.js.
RUN npm install

# Copia todo o código fonte da aplicação para o diretório de trabalho.
COPY . .

# Constrói a aplicação Next.js para produção.
# Isso inclui a transpilação, otimização e geração de arquivos estáticos.
RUN npm run build

# Imagem de produção - uma imagem menor para execução.
FROM node:20-alpine AS runner

# Define o diretório de trabalho dentro do contêiner.
WORKDIR /app

# Define o ambiente como produção.
ENV NODE_ENV production

# Copia os arquivos gerados pelo build do Next.js.
# Estes incluem o '.next' (código otimizado) e o 'public' (ativos estáticos).
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public

# Expõe a porta em que a aplicação Next.js irá rodar.
EXPOSE 3000

# Comando padrão para iniciar a aplicação Next.js em produção.
# O 'next start' inicia o servidor de produção do Next.js.
CMD ["npm", "start"]
