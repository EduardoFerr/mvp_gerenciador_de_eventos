# 🎯 Backend do Sistema de Gerenciamento de Eventos

Este é o serviço de backend (API RESTful) para o Sistema de Gerenciamento de Eventos com Reservas. Ele é responsável por toda a lógica de negócios, autenticação, gerenciamento de dados e interação com o banco de dados PostgreSQL e o cache Redis.


- Backend (Heroku): https://emsr-backend-24afa39be4e1.herokuapp.com/api/health
- Repositório: https://github.com/EduardoFerr/mvp_gerenciador_de_eventos/tree/master/backend

---

## 🚀 Tecnologias

- **Linguagem:** TypeScript
- **Framework:** Node.js com Express.js
- **ORM:** Prisma ORM
- **Banco de Dados:** PostgreSQL
- **Cache:** Redis
- **Autenticação:** JWT (JSON Web Tokens)
- **Validação:** Zod

---

## 📦 Estrutura de Pastas

```
backend/
├── Dockerfile
├── Procfile
├── package.json
├── tsconfig.json
├── .env.example
├── .dockerignore
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── config/
│   ├── middlewares/
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   ├── types/
│   ├── validation/
│   └── server.ts
└── README.md
```

---

## ✨ Funcionalidades da API

### 🔐 Autenticação e Usuários

- `POST /api/users/register`: Registra novo usuário.
- `POST /api/users/login`: Login e retorna JWT.
- `GET /api/users/me`: Perfil do usuário autenticado (JWT).
- `GET /api/users/:id`: Perfil de outro usuário (JWT + ADMIN).
- `PUT /api/users/:id`: Atualiza perfil (próprio se USER, qualquer um se ADMIN).
- `DELETE /api/users/:id`: Deleta usuário (ADMIN).
- `GET /api/users`: Lista todos usuários (ADMIN).

### 📅 Eventos

- `POST /api/events`: Cria evento (ADMIN).
- `GET /api/events`: Lista eventos (filtros: name, date).
- `GET /api/events/:id`: Detalhes de evento.
- `PUT /api/events/:id`: Atualiza evento (ADMIN).
- `DELETE /api/events/:id`: Remove evento (ADMIN).

### 📌 Reservas

- `POST /api/reservations/events/:id/reserve`: Reserva evento (USER).
- `DELETE /api/reservations/:id`: Cancela reserva (USER/ADMIN).
- `GET /api/reservations/my-reservations`: Reservas do usuário (USER).
- `GET /api/reservations/events/:id/reservations`: Todas as reservas do evento (ADMIN).

---

## ⚙️ Como Executar (via Docker Compose)

Recomenda-se rodar o backend com Docker Compose. Siga o `README.md` do projeto raiz.

---

## 🛠️ Variáveis de Ambiente (.env)

O backend usa as seguintes variáveis:

- `DATABASE_URL`: Conexão com PostgreSQL (`db` no Docker).
- `REDIS_URL`: Conexão com Redis (`redis` no Docker).
- `JWT_SECRET`: Chave JWT.
- `NODE_ENV`: `development` ou `production`.
- `PORT`: Porta do servidor Express (padrão: 3001).

---

## 🐳 Dockerfile & Procfile

- **Dockerfile:** Multi-stage para imagem otimizada.
- **Procfile (Heroku):**
  - `web`: `npm run start`
  - `release`: `npx prisma migrate deploy`

---

## 🧪 Verificação Manual

Teste com Postman, Insomnia ou via frontend.

Use os comandos do `Makefile` localmente no projeto raiz:

```bash
make test-token
make test-me
make test-reservations
```
