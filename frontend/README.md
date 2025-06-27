Frontend do Sistema de Gerenciamento de Eventos
Esta é a aplicação web frontend para o Sistema de Gerenciamento de Eventos com Reservas. Ela é construída com Next.js e React, consumindo a API RESTful do backend.

🚀 Tecnologias
Framework: Next.js (React Framework)

Linguagem: TypeScript

Estilização: Tailwind CSS

Gerenciamento de Estado: React Context API (para autenticação)

Navegação: Next.js App Router

✨ Funcionalidades
Páginas de Login e Registro de Usuários.

Listagem de todos os eventos com filtros por nome e data.

Página de detalhes do evento, mostrando vagas disponíveis e opção de reserva (se autenticado como USER).

Página "Minhas Reservas" para usuários autenticados verem e cancelarem suas reservas.

Painel de Administração (acessível apenas para ADMIN):

Criação, edição e exclusão de eventos.

Visualização de todas as reservas no sistema.

Design responsivo para diferentes tamanhos de tela.

Feedback visual claro para ações (sucesso, erro, carregamento).

📦 Estrutura de Pastas
frontend/
├── Dockerfile                  # Define como o contêiner Docker do frontend é construído.
├── package.json                # Dependências e scripts do Next.js.
├── tsconfig.json               # Configurações do TypeScript.
├── next.config.js              # Configurações do Next.js.
├── tailwind.config.js          # Configurações do Tailwind CSS.
├── .env.example                # Variáveis de ambiente de exemplo.
├── .env.local                  # Variáveis de ambiente locais (para a URL da API).
├── public/                     # Ativos estáticos (imagens, favicons, etc.).
├── src/                        # Código fonte principal da aplicação.
│   ├── app/                    # Páginas e layout do Next.js (App Router).
│   │   ├── (auth)/             # Páginas de autenticação (login, register).
│   │   ├── admin/              # Páginas do painel de administração.
│   │   ├── events/             # Páginas de listagem e detalhes de eventos.
│   │   ├── my-reservations/    # Página de reservas do usuário.
│   │   ├── layout.tsx
│   │   └── page.tsx            # Página inicial (listagem de eventos).
│   ├── components/             # Componentes React reutilizáveis (Header, EventCard, UI).
│   │   ├── ui/                 # Componentes Shadcn/ui customizados (Button, Input).
│   │   └── AuthContext.tsx     # Contexto para gerenciamento de autenticação.
│   ├── lib/                    # Funções utilitárias (api.ts, cn.ts).
│   └── styles/                 # Estilos globais (globals.css).

🚀 Como Executar (Localmente via Docker Compose)
Para rodar o frontend localmente, é necessário que o backend e os bancos de dados estejam funcionando via Docker Compose. Siga as instruções no README do Projeto Raiz.

Variáveis de Ambiente (.env.local)
O frontend espera a seguinte variável de ambiente no arquivo .env.local (na pasta frontend):

NEXT_PUBLIC_API_URL: A URL base da sua API backend (ex: http://localhost:3001/api).

🌐 Deploy
Este frontend pode ser facilmente implantado em plataformas como o Vercel.

Deploy no Vercel
Instale o Vercel CLI:

npm i -g vercel

Faça login no Vercel:

vercel login

Navegue até a pasta frontend do seu projeto:

cd frontend

Ligue o projeto Vercel ao seu diretório local:

vercel link

Siga as instruções para criar um novo projeto Vercel.

Adicione a URL do seu backend como uma variável de ambiente no Vercel. Certifique-se de usar a URL pública do seu backend (ex: do Fly.io).

vercel env add NEXT_PUBLIC_API_URL production

Quando solicitado, cole a URL completa do seu backend Fly.io (ex: https://seu-backend.fly.dev/api).

Realize o deploy:

vercel deploy --prod

O Vercel construirá e implantará sua aplicação, fornecendo uma URL pública ao final.