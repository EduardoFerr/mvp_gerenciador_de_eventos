// frontend/src/app/register/page.tsx
// Esta página lida com o processo de registro de novos usuários.

"use client"; // Marca este componente como um Componente Cliente.

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Hook para navegação programática.
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthContext'; // Hook para acessar o contexto de autenticação.
import { cn } from '@/lib/utils'; // Importado para usar cn no JSX


const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { login } = useAuth(); // Função de login do contexto de autenticação.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Chama a API de registro do backend.
      const data = await apiFetch<{ message: string; token: string; user: { id: string; email: string; role: 'USER' | 'ADMIN' } }>('/users/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      // Se o registro for bem-sucedido, automaticamente loga o usuário.
      login(data.token, data.user);
      alert(data.message);
      router.push('/'); // Redireciona para a página inicial.
    } catch (err: any) {
      // Lida com erros da API.
      setError(err.message || 'Falha no registro. Por favor, tente novamente.');
      // Se houver erros de validação Zod, a mensagem de erro pode ser mais detalhada.
      if (err.errors && Array.isArray(err.errors)) {
        setError(err.errors.map((e: any) => e.message).join(', '));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col"> {/* Ajustado bg-gray-50 para bg-background */}
      <Header />
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="bg-card p-8 rounded-md w-full max-w-md"> {/* Removido shadow-xl, ajustado rounded-lg para rounded-md */}
          <h1 className="text-3xl font-bold text-center text-foreground mb-6">Registrar</h1> {/* Ajustado text-primary-foreground para text-foreground */}
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
                Senha (mínimo 6 caracteres)
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
              {loading ? 'Registrando...' : 'Registrar'}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground"> {/* Ajustado text-gray-600 */}
            Já tem uma conta?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium"> {/* Ajustado text-primary-foreground */}
              Faça login
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default RegisterPage;
