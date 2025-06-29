# 🎟️ Sistema de Gerenciamento de Eventos com Reservas


Este é um sistema full-stack de gerenciamento de eventos que permite que **administradores** criem e gerenciem eventos, enquanto **usuários comuns** podem visualizar e reservar vagas.  

## 🌍 Links de Produção (Demo)

- Frontend (Vercel): https://frontend-emsr.vercel.app
- Backend (Heroku): https://emsr-backend-24afa39be4e1.herokuapp.com/api/health
- Repositório: github.com/EduardoFerr/mvp_gerenciador_de_eventos/tree/main
- [Repositório Frontend: github.com/EduardoFerr/mvp_gerenciador_de_eventos/](https://github.com/EduardoFerr/mvp_gerenciador_de_eventos/tree/main/backend)
- [Repositório Backend: github.com/EduardoFerr/mvp_gerenciador_de_eventos/](https://github.com/EduardoFerr/mvp_gerenciador_de_eventos/tree/main/frontend)
---

## 🚀 Tecnologias Utilizadas

### 🐳 Orquestração:
- Docker
- Docker Compose

### 🔧 Backend:
- Node.js + Express.js
- TypeScript
- Prisma ORM
- PostgreSQL (Local: Docker | Deploy: Neon.tech)
- Redis (Local: Docker | Deploy: Upstash)
- JWT (Autenticação)
- Zod (Validação)

### 🎨 Frontend:
- Next.js (React)
- TypeScript
- Tailwind CSS
- Lucide React (Ícones)

---

## 📁 Estrutura do Projeto

```bash
.
├── docker-compose.yml         # Define os serviços Docker
├── backend/                   # Backend Express API
│   ├── Dockerfile             
│   ├── Procfile               
│   ├── package.json
│   ├── prisma/                
│   ├── src/                   
│   ├── .env.example           
│   ├── .dockerignore          
│   ├── entrypoint.sh          
│   └── ...
├── frontend/                  # Frontend Next.js
│   ├── Dockerfile             
│   ├── package.json
│   ├── public/                
│   ├── src/                   
│   ├── .env.example
│   ├── .env.local             
│   ├── .gitignore             
│   ├── next.config.js         
│   ├── tailwind.config.js     
│   ├── tsconfig.json          
│   └── ...
├── README.md                  
├── .gitignore                 
└── Makefile                   # Comandos úteis
```

---

## ⚙️ Configuração e Execução (Local)

### 🔁 1. Clone o repositório

```bash
git clone https://github.com/EduardoFerr/mvp_gerenciador_de_eventos.git
cd mvp_gerenciador_de_eventos
```

---

### 🔑 2. Configurar variáveis de ambiente

#### Backend:

```bash
cd backend
cp .env.example .env
# Edite o arquivo:
# - DATABASE_URL: postgresql://user:password@db:5432/event_management_db?schema=public
# - REDIS_URL: redis://redis:6379
# - JWT_SECRET: (use openssl rand -base64 32)
cd ..
```

#### Frontend:

```bash
cd frontend
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3001/api
cd ..
```

---

### 🔨 3. Gerar Migrações do Prisma

```bash
cd backend
npm install
npx prisma migrate dev --name initial_schema_setup
cd ..
```

---

### 🐳 4. Levantar os contêineres com Docker

```bash
make up-no-cache
```

---

### 🌐 5. Acessar a Aplicação

Abra no navegador:  
👉 http://localhost:3000  
**Dica:** Limpe cookies e cache (Ctrl+F5)

---

### 🔐 Credenciais de Teste

**Admin:**  
- E-mail: `admin@admin.com`  
- Senha: `password123`

**Usuário comum:**  
- E-mail: `user1@teste.com`  
- Senha: `password123`

---

## 🧹 Limpeza

Para remover tudo e resetar:

```bash
make rmi
```

---

## ☁️ Deploy na Nuvem (Heroku & Vercel)

### ✅ Pré-requisitos

- Heroku CLI + conta
- Vercel CLI + conta
- Conta Neon.tech (PostgreSQL)
- Conta Upstash (Redis)

---

### 🚀 Backend (Heroku)

```bash
cd backend
heroku create seu-nome-do-app-backend-unico

heroku config:set \
  DATABASE_URL="<NEON_URL>" \
  REDIS_URL="<UPSTASH_URL>" \
  JWT_SECRET="<SEGREDO>" \
  NODE_ENV="production" \
  NPM_CONFIG_PRODUCTION=false

git push heroku main

# Após o deploy:
heroku run npm run prisma:seed -a seu-nome-do-app-backend-unico
```

---

### 🚀 Frontend (Vercel)

```bash
cd frontend
vercel link

vercel env add NEXT_PUBLIC_API_URL production
# Informe a URL do Heroku (ex: https://seu-backend.herokuapp.com/api)

vercel deploy --prod
```

---

