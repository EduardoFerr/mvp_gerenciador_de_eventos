// frontend/src/components/Header.tsx
// Este componente representa o cabeçalho de navegação da aplicação.

"use client"; // Marca este componente como um Componente Cliente.

import React from 'react';
import Link from 'next/link'; // Componente de link do Next.js para navegação SPA.
import { useAuth } from '@/components/AuthContext'; // Hook para acessar o contexto de autenticação.
import { Button } from './ui/button'; // Importa o componente Button.
import { cn } from '@/lib/utils'; // Função utilitária para classes CSS.

// Define as props para o componente Header (atualmente, não há props específicas).
interface HeaderProps {
  className?: string; // Para aplicar classes Tailwind adicionais
}

const Header: React.FC<HeaderProps> = ({ className }) => {
  const { isAuthenticated, user, logout } = useAuth(); // Acessa o estado de autenticação e as funções.

  return (
    <header className={cn(
      "bg-primary text-primary-foreground p-4 shadow-md",
      "flex flex-col sm:flex-row justify-between items-center gap-4",
      "rounded-b-lg", // Adiciona bordas arredondadas na parte inferior
      className
    )}>
      <div className="flex-shrink-0">
        <Link href="/" className="text-2xl font-bold hover:text-white transition-colors duration-200">
          Gerenciador de Eventos
        </Link>
      </div>
      <nav className="flex flex-wrap justify-center sm:justify-end items-center gap-4">
        <Link href="/" className="hover:text-white transition-colors duration-200">
          Eventos
        </Link>
        {isAuthenticated && user?.role === 'USER' && (
          <Link href="/my-reservations" className="hover:text-white transition-colors duration-200">
            Minhas Reservas
          </Link>
        )}
        {isAuthenticated && user?.role === 'ADMIN' && (
          <>
            <Link href="/admin/events" className="hover:text-white transition-colors duration-200">
              Gerenciar Eventos
            </Link>
            <Link href="/admin/reservations" className="hover:text-white transition-colors duration-200">
              Ver Reservas
            </Link>
          </>
        )}
        <div className="border-l border-primary-foreground/50 h-6 mx-2 hidden sm:block"></div> {/* Separador visual */}
        {!isAuthenticated ? (
          <>
            <Button asChild variant="secondary" className="px-4 py-2 rounded-md hover:bg-secondary/80">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild variant="outline" className="px-4 py-2 rounded-md border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              <Link href="/register">Registrar</Link>
            </Button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm">Olá, {user?.email} ({user?.role})</span>
            <Button
              onClick={logout}
              variant="outline"
              className="px-4 py-2 rounded-md border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
            >
              Sair
            </Button>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
