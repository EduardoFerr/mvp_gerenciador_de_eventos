// frontend/src/app/layout.tsx
// Este é o componente de layout raiz do Next.js.
// Ele envolve toda a aplicação e é onde configuramos estilos globais, fontes, etc.

import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Importa a fonte Inter do Google Fonts.
import './../styles/globals.css'; // Importa os estilos globais (incluindo Tailwind CSS).
import { AuthProvider } from '@/components/AuthContext'; // Importa o Provedor de Autenticação.

// Configura a fonte Inter. `subsets: ['latin']` para incluir caracteres latinos.
// `variable: '--font-sans'` cria uma variável CSS para a fonte, que é usada em `tailwind.config.js`.
const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

// Metadados da aplicação, usados para SEO e descrição da página.
export const metadata: Metadata = {
  title: 'Gerenciamento de Eventos',
  description: 'Sistema de Gerenciamento de Eventos com Reservas.',
};

// O componente RootLayout é um componente de servidor no Next.js (por padrão).
// Ele recebe 'children' como props, que serão as páginas da sua aplicação.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR"> {/* Define o idioma da página como Português do Brasil */}
      <body className={inter.variable}> {/* Aplica a variável da fonte Inter ao corpo */}
        {/*
          AuthProvider envolve toda a aplicação para que o contexto de autenticação
          esteja disponível em todos os componentes filhos.
        */}
        <AuthProvider>
          {children} {/* Renderiza o conteúdo das páginas aqui */}
        </AuthProvider>
      </body>
    </html>
  );
}

