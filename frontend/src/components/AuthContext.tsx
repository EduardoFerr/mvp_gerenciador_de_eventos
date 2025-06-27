// frontend/src/components/AuthContext.tsx
// Este arquivo define o Contexto de Autenticação para a aplicação.
// Ele gerencia o estado de login/logout do usuário e fornece o token JWT e informações do usuário.

"use client"; // Marca este componente como um Componente Cliente (Client Component) no Next.js.

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie'; // Biblioteca para gerenciar cookies.
import { apiFetch } from '@/lib/api'; // Função utilitária para requisições à API.

// Define a interface para o objeto do usuário que será armazenado no contexto.
interface User {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

// Define a interface para o estado do contexto de autenticação.
interface AuthContextType {
  user: User | null;         // O objeto do usuário autenticado, ou null se não estiver logado.
  token: string | null;      // O token JWT, ou null.
  isAuthenticated: boolean;  // Booleano indicando se o usuário está autenticado.
  isLoading: boolean;        // Booleano indicando se o estado de autenticação está sendo carregado.
  login: (token: string, user: User) => void; // Função para realizar o login.
  logout: () => void;        // Função para realizar o logout.
}

// Cria o Contexto de Autenticação com um valor padrão (que será substituído pelo provedor).
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props para o AuthProvider.
interface AuthProviderProps {
  children: ReactNode; // Os componentes filhos que serão envolvidos pelo provedor.
}

// O componente AuthProvider, que gerencia o estado de autenticação.
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Inicialmente true para carregar o estado inicial.

  // Efeito que roda uma vez ao montar o componente para verificar o token no cookie.
  useEffect(() => {
    const loadAuthStatus = async () => {
      const storedToken = Cookies.get('token');
      if (storedToken) {
        try {
          // Tenta verificar o token chamando uma rota de perfil (se tiver uma)
          // ou decodificando localmente (se for um token sem verificação de assinatura no frontend)
          // Para simplicidade e segurança, vamos tentar buscar o perfil do usuário.
          // Isso também valida o token no backend.
          const res = await apiFetch<{ user: User }>('/users/me', {
            method: 'GET',
            token: storedToken, // Passa o token para a requisição
          });

          setUser(res.user);
          setToken(storedToken);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Falha ao validar token:", error);
          // Se o token for inválido, remova-o.
          Cookies.remove('token');
          setUser(null);
          setToken(null);
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false); // Terminou de carregar.
    };

    loadAuthStatus();
  }, []); // Array de dependências vazio significa que ele roda apenas uma vez ao montar.

  // Função para realizar o login.
  const login = (newToken: string, newUser: User) => {
    Cookies.set('token', newToken, {
      expires: 7,
      path: '/',
      sameSite: 'Lax',
      secure:false
    }); 
    setToken(newToken);
    setUser(newUser);
    setIsAuthenticated(true);
  };

  // Função para realizar o logout.
  const logout = () => {
    Cookies.remove('token'); // Remove o token do cookie.
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  // O valor que será fornecido a todos os consumidores do contexto.
  const contextValue: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };

  // Renderiza os filhos, fornecendo o valor do contexto.
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar o contexto de autenticação.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

