// frontend/src/app/login/page.tsx
// Esta página lida com o processo de login do usuário.

"use client"; // Marca este componente como um Componente Cliente.

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Hook para navegação programática no Next.js 13+ App Router.
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthContext'; // Hook para acessar o contexto de autenticação.
import { cn } from '@/lib/utils'; // Importado para usar cn no JSX

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter(); // Instância do router para redirecionamento.
  const { login } = useAuth(); // Função de login do contexto de autenticação.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Previne o comportamento padrão do formulário de recarregar a página.
    setLoading(true);
    setError(null);

    try {
      // Chama a API de login do backend.
      const data = await apiFetch<{ message: string; token: string; user: { id: string; email: string; role: 'USER' | 'ADMIN' } }>('/users/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      // Se o login for bem-sucedido, armazena o token e o usuário no contexto.
      login(data.token, data.user);
      alert(data.message); // Exibe mensagem de sucesso.
      router.push('/'); // Redireciona para a página inicial após o login.
    } catch (err: any) {
      // Lida com erros da API.
      setError(err.message || 'Falha no login. Por favor, verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col"> {/* Ajustado bg-gray-50 para bg-background */}
      <Header />
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="bg-card p-8 rounded-md w-full max-w-md"> {/* Removido shadow-xl, ajustado rounded-lg para rounded-md */}
          <h1 className="text-3xl font-bold text-center text-foreground mb-6">Login</h1> {/* Ajustado text-primary-foreground para text-foreground */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1"> {/* Ajustado text-gray-700 */}
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                placeholder="seu.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-md"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1"> {/* Ajustado text-gray-700 */}
                Senha
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-md"
              />
            </div>
            {error && <p className="text-destructive text-sm text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground"> {/* Ajustado text-gray-600 */}
            Não tem uma conta?{' '}
            <Link href="/register" className="text-primary hover:underline font-medium"> {/* Ajustado text-primary-foreground */}
              Registre-se aqui
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
