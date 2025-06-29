


"use client"; 

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; 
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthContext'; 
import { cn } from '@/lib/utils'; 

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter(); 
  const { login } = useAuth(); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setLoading(true);
    setError(null);

    try {
      
      const data = await apiFetch<{ message: string; token: string; user: { id: string; email: string; role: 'USER' | 'ADMIN' } }>('/users/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      
      login(data.token, data.user);
      alert(data.message); 
      router.push('/'); 
    } catch (err: any) {
      
      setError(err.message || 'Falha no login. Por favor, verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col"> 
      <Header />
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="bg-card p-8 rounded-md w-full max-w-md"> 
          <h1 className="text-3xl font-bold text-center text-foreground mb-6">Login</h1> 
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
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
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1"> 
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
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Não tem uma conta?{' '}
            <Link href="/register" className="text-primary hover:underline font-medium"> 
              Registre-se aqui
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
