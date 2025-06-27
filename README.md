# Sistema de Gerenciamento de Eventos com Reservas

Este é um sistema full-stack de gerenciamento de eventos que permite que administradores criem e gerenciem eventos, e usuários comuns se registrem, visualizem eventos e reservem vagas. A aplicação é construída com:

* **Backend:** Node.js (Express.js, TypeScript, Prisma, PostgreSQL, Redis)
* **Frontend:** Next.js (React, TypeScript, Tailwind CSS)

---

## 🚀 Tecnologias Utilizadas

### Orquestração:

* Docker
* Docker Compose

### Backend:

* Node.js, Express.js
* TypeScript
* Prisma ORM
* PostgreSQL (Banco de Dados)
* Redis (Cache)
* JWT (Autenticação)
* Zod (Validação)

### Frontend:

* Next.js (React Framework)
* TypeScript
* Tailwind CSS

---

## 📦 Estrutura do Projeto

```
.
├── docker-compose.yml         # Define os serviços Docker (DB, Redis, Backend, Frontend)
├── backend/                   # Diretório da aplicação Backend
│   ├── Dockerfile
│   ├── package.json
│   ├── prisma/                # Schema do Prisma e Migrações
│   ├── src/                   # Código fonte da API
│   ├── .env.example
│   └── ...
├── frontend/                  # Diretório da aplicação Frontend
│   ├── Dockerfile
│   ├── package.json
│   ├── public/                # Ativos estáticos do Next.js
│   ├── src/                   # Código fonte da aplicação React
│   ├── .env.example
│   └── ...
├── README.md                  # Este arquivo
└── .gitignore
```

---

## ⚙️ Configuração e Execução (Ambiente de Desenvolvimento)

### Passo 1: Clone o Repositório

```bash
git clone <URL_DO_SEU_REPOSITORIO>
cd <nome_da_pasta_do_projeto>
```

### Passo 2: Configurar Variáveis de Ambiente

#### Para o Backend:

```bash
cd backend
cp .env.example .env
```

Edite `.env` e substitua a chave JWT por algo seguro. Mantenha `DATABASE_URL` e `REDIS_URL` como estão.

```bash
cd ..
```

#### Para o Frontend:

```bash
cd frontend
cp .env.example .env.local
```

Edite `.env.local` e certifique-se de que:

```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
```

```bash
cd ..
```

### Passo 3: Gerar Migrações do Prisma (localmente)

```bash
cd backend
npm install
npx prisma migrate dev --name init_database_schema
cd ..
```

### Passo 4: Levantar o Ambiente Docker

```bash
docker compose up -d --build
```

### Passo 5: Aplicar Migrações e Executar Seed no Container

```bash
docker compose exec backend bash
npx prisma migrate deploy
npm run prisma:seed
exit
```

### Passo 6: Acessar a Aplicação

Abra o navegador:

```
http://localhost:3000
```

#### Credenciais de Teste:

**Administrador**

* E-mail: `admin@admin.com`
* Senha: `password123`

**Usuário Comum**

* E-mail: `user@teste.com`
* Senha: `password123`

---

## 🧹 Limpeza

```bash
docker compose down --volumes
```

---

## ⚠️ Solução de Problemas Comuns

### Erro: P1001 - Can't reach database server at db:5432

* Verifique se o Docker está rodando
* Veja se a porta 5432 está em uso (troque para 5433:5432, se necessário)
* Execute `npx prisma migrate dev` com Docker DB rodando

### Contêiner backend reiniciando

* Pode ser problema na ordem de inicialização
* Solução: `docker compose down --volumes && docker rmi $(docker images -aq) && docker compose up -d --build`

### Prisma Schema não encontrado no Dockerfile

* Certifique-se de que o Dockerfile copia a pasta `prisma` antes da instalação

### Erros no frontend (React.Children.only etc)

* Atualize os arquivos do frontend
* Limpe o cache do navegador (Ctrl+F5)

### Admin desloga após atualizar

* Motivo: seed gera novos IDs; cookies ficam inválidos
* Solução: limpar cookies e logar novamente após `docker compose down --volumes`

---

> Qualquer dúvida, verifique os logs com `docker compose logs -f backend` ou `frontend` ou `db`.
