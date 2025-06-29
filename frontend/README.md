# 💡 Frontend do Sistema de Gerenciamento de Eventos

Esta é a aplicação web frontend para o Sistema de Gerenciamento de Eventos com Reservas.\
Ela é construída com **Next.js e React**, consumindo a API RESTful do backend.

## 🌍 Links de Produção (Demo)

- Frontend (Vercel): https://frontend-emsr.vercel.app
- Repositório: https://github.com/EduardoFerr/mvp_gerenciador_de_eventos/tree/master/frontend

---

## 🚀 Tecnologias

- **Framework:** Next.js (React)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **Ícones:** Lucide React
- **Gerenciamento de Estado:** React Context API (autenticação)
- **Navegação:** Next.js App Router

---

## ✨ Funcionalidades

- Login e Registro de Usuários
- Listagem de Eventos com filtros (nome, data)
- Detalhes de Evento com reservas
- Página "Minhas Reservas"
- **Painel ADMIN:**
  - CRUD de eventos
  - Visualização de reservas
- Design responsivo
- Feedback claro (sucesso, erro, carregamento)
- Integração total com API REST

---

## 📁 Estrutura de Pastas

```
frontend/
├── Dockerfile
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
├── .env.example
├── .env.local
├── public/
├── src/
│   ├── app/
│   │   ├── (auth)/           # Login e Registro
│   │   ├── admin/            # Admin Panel
│   │   ├── events/           # Eventos (lista + detalhe)
│   │   ├── my-reservations/  # Reservas do usuário
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/               # UI Components (Button, Input, etc.)
│   │   └── AuthContext.tsx
│   ├── lib/                  # Funções utilitárias (api.ts, cn.ts)
│   └── styles/               # Estilos globais (globals.css)
└── README.md
```

---

## ⚙️ Como Executar (Local via Docker Compose)

É necessário que o backend + banco estejam rodando com Docker Compose.\
Siga o `README.md` do projeto principal.

---

## 🛠️ Variáveis de Ambiente (.env.local)

O frontend requer:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## ☁️ Deploy no Vercel

### Passo a passo:

1. Instale o Vercel CLI:

```bash
npm i -g vercel
```

2. Faça login:

```bash
vercel login
```

3. Navegue até a pasta frontend:

```bash
cd frontend
```

4. Link com o projeto Vercel:

```bash
vercel link
```

5. Configure a URL da API backend:

```bash
vercel env add NEXT_PUBLIC_API_URL production
# Exemplo: https://seu-backend.herokuapp.com/api
```

6. Deploy:

```bash
vercel deploy --prod
```

---

Após isso, o Vercel fornecerá uma **URL pública** com a aplicação em produção.

