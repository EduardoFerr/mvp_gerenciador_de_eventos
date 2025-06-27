# Backend do Sistema de Gerenciamento de Eventos

Este é o serviço de backend (API RESTful) para o Sistema de Gerenciamento de Eventos com Reservas. Ele é responsável por toda a lógica de negócios, autenticação, gerenciamento de dados e interação com o banco de dados PostgreSQL e o cache Redis.

---

## 🚀 Tecnologias

* **Linguagem:** TypeScript
* **Framework:** Node.js com Express.js
* **ORM:** Prisma ORM
* **Banco de Dados:** PostgreSQL
* **Cache:** Redis
* **Autenticação:** JWT (JSON Web Tokens)
* **Validação:** Zod

---

## 📦 Estrutura de Pastas

```
backend/
├── Dockerfile                  # Define como o contêiner Docker do backend é construído
├── package.json                # Dependências e scripts do Node.js
├── tsconfig.json               # Configurações do TypeScript
├── .env.example                # Variáveis de ambiente de exemplo
├── prisma/                     # Schema do banco de dados e arquivos de migração
│   ├── schema.prisma
│   ├── seed.ts                 # Script para popular o banco de dados
│   └── migrations/             # Histórico de migrações do Prisma
├── src/                        # Código fonte principal da aplicação
│   ├── config/                 # Configurações (Redis, JWT)
│   ├── middlewares/            # Middlewares (autenticação, autorização)
│   ├── controllers/            # Lógica dos controladores (usuários, eventos, reservas)
│   ├── routes/                 # Definição das rotas da API
│   ├── types/                  # Tipos customizados (ex: Request do Express)
│   ├── validation/             # Schemas de validação Zod
│   └── server.ts               # Ponto de entrada da aplicação Express
└── entrypoint.sh               # Script de inicialização do contêiner Docker
```

---

## ✨ Funcionalidades da API

### Autenticação e Usuários

* `POST /api/users/register`: Registra um novo usuário (papel USER padrão)
* `POST /api/users/login`: Autentica e retorna um JWT
* `GET /api/users/me`: Perfil do usuário autenticado (Requer JWT)
* `GET /api/users/:id`: Perfil de outro usuário (Requer JWT, ADMIN apenas)
* `PUT /api/users/:id`: Atualiza usuário (USER pode alterar o próprio, ADMIN qualquer um)
* `DELETE /api/users/:id`: Remove usuário (ADMIN apenas)
* `GET /api/users`: Lista todos os usuários (ADMIN apenas)

### Eventos

* `POST /api/events`: Cria evento (ADMIN apenas)
* `GET /api/events`: Lista eventos (filtro: `name`, `date`)
* `GET /api/events/:id`: Detalhes de evento
* `PUT /api/events/:id`: Atualiza evento (ADMIN apenas)
* `DELETE /api/events/:id`: Remove evento (ADMIN apenas)

### Reservas

* `POST /api/reservations/events/:id/reserve`: Reserva vaga (USER apenas)
* `DELETE /api/reservations/:id`: Cancela reserva (USER pode cancelar próprias, ADMIN qualquer uma)
* `GET /api/reservations/my-reservations`: Lista reservas do usuário autenticado (USER apenas)
* `GET /api/reservations/events/:id/reservations`: Lista reservas de um evento (ADMIN apenas)

---

## 🚀 Como Executar (Localmente via Docker Compose)

Para rodar o backend, utilize o Docker Compose conforme descrito no README da raiz do projeto. Ele cuida da integração com frontend, banco e cache.

---

## 🌱 Variáveis de Ambiente (`.env`)

O backend depende das seguintes variáveis:

```env
DATABASE_URL=postgresql://user:password@db:5432/database
REDIS_URL=redis://default@redis:6379
JWT_SECRET=chave_super_secreta
NODE_ENV=development
PORT=3001
```

---

## 🐳 Dockerfile

O Dockerfile do backend é multi-stage, com os seguintes estágios:

1. Instalação das dependências de desenvolvimento
2. Compilação do TypeScript
3. Criação da imagem final com apenas dependências de produção
4. Instalação de `openssl` e `postgresql-client` (para `pg_isready` e compatibilidade Prisma)
5. Copia e usa `entrypoint.sh` para aplicar migrações e rodar o seed na inicialização

---

## 📝 Testes

A API pode ser testada via:

* **Postman** ou **Insomnia** (manual)
* **Frontend integrado** (recomendado para fluxo completo de usuário)

---

> Para dúvidas e problemas, verifique os logs com `docker compose logs -f backend`.
