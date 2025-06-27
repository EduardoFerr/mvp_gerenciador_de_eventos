// frontend/src/app/page.tsx
// Esta é a página principal da aplicação, que lista todos os eventos disponíveis.

"use client"; // Marca este componente como um Componente Cliente.

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import EventCard from '@/components/EventCard';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CalendarDaysIcon, SearchIcon, XCircleIcon } from 'lucide-react'; // Ícones

// Interface para o tipo de dados do evento, correspondendo ao backend.
interface Event {
  id: string;
  name: string;
  description: string | null;
  eventDate: string; // Vindo como string ISO do backend
  location: string | null;
  onlineLink: string | null;
  maxCapacity: number;
  availableSpots: number;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}

// Interface para o tipo de dados da reserva, correspondendo ao backend.
interface Reservation {
  id: string;
  eventId: string;
  userId: string;
  reservationDate: string;
  status: 'CONFIRMED' | 'CANCELED';
}

const HomePage: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterName, setFilterName] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);

  // Função para buscar eventos da API.
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Constrói a query string para os filtros.
      const queryParams = new URLSearchParams();
      if (filterName) queryParams.append('name', filterName);
      if (filterDate) queryParams.append('date', filterDate);

      const url = `/events${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const data = await apiFetch<{ events: Event[] }>(url, { method: 'GET' });
      setEvents(data.events);
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar eventos.');
    } finally {
      setLoading(false);
    }
  }, [filterName, filterDate]);

  // Função para buscar as reservas do usuário.
  const fetchMyReservations = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'USER') {
      setMyReservations([]); // Limpa as reservas se não for usuário ou não estiver autenticado
      return;
    }
    try {
      const data = await apiFetch<{ reservations: Reservation[] }>('/reservations/my-reservations', { method: 'GET' });
      // Filtra para mostrar apenas as reservas CONFIRMED
      setMyReservations(data.reservations.filter(res => res.status === 'CONFIRMED'));
    } catch (err: any) {
      console.error('Falha ao carregar minhas reservas:', err);
      // Não exibe erro na UI para esta parte, apenas no console.
    }
  }, [isAuthenticated, user?.role]);

  // Efeito para carregar eventos e reservas na montagem e quando os filtros mudam.
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Efeito para carregar minhas reservas quando o estado de autenticação ou o usuário muda.
  useEffect(() => {
    if (!authLoading) { // Garante que a autenticação foi carregada
      fetchMyReservations();
    }
  }, [authLoading, fetchMyReservations]);

  // Função para lidar com a reserva de um evento.
  const handleReserve = async (eventId: string) => {
    if (!isAuthenticated) {
      alert('Você precisa estar logado para reservar uma vaga.');
      return;
    }
    if (user?.role !== 'USER') {
      alert('Apenas usuários comuns podem fazer reservas.');
      return;
    }

    try {
      // Chama a API para criar a reserva.
      const res = await apiFetch<{ message: string; reservation: Reservation }>(`/reservations/events/${eventId}/reserve`, {
        method: 'POST',
      });
      alert(res.message);
      // Recarrega os eventos e as reservas do usuário para refletir as mudanças.
      fetchEvents();
      fetchMyReservations();
    } catch (err: any) {
      alert(err.message || 'Falha ao reservar vaga.');
    }
  };

  // Função para resetar os filtros.
  const handleClearFilters = () => {
    setFilterName('');
    setFilterDate('');
  };

  // Determina se um evento já foi reservado pelo usuário atual.
  const isEventReservedByUser = (eventId: string): boolean => {
    if (!isAuthenticated || user?.role !== 'USER') return false;
    return myReservations.some(res => res.eventId === eventId && res.userId === user?.id && res.status === 'CONFIRMED');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold text-center text-primary-foreground mb-8">Eventos Disponíveis</h1>

        {/* Seção de Filtros */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label htmlFor="filterName" className="block text-sm font-medium text-gray-700 mb-1">
              Filtrar por Nome
            </label>
            <Input
              id="filterName"
              type="text"
              placeholder="Nome do evento..."
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="w-full rounded-md"
            />
          </div>
          <div>
            <label htmlFor="filterDate" className="block text-sm font-medium text-gray-700 mb-1">
              Filtrar por Data
            </label>
            <Input
              id="filterDate"
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full rounded-md"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchEvents} className="w-full md:w-auto">
              <SearchIcon className="mr-2 h-4 w-4" /> Buscar
            </Button>
            <Button onClick={handleClearFilters} variant="outline" className="w-full md:w-auto">
              <XCircleIcon className="mr-2 h-4 w-4" /> Limpar Filtros
            </Button>
          </div>
        </div>

        {/* Exibição de Status (Carregando, Erro, Sem Eventos) */}
        {loading && (
          <div className="text-center text-gray-600 text-lg">Carregando eventos...</div>
        )}
        {error && (
          <div className="text-center text-destructive text-lg font-semibold">{error}</div>
        )}
        {!loading && !error && events.length === 0 && (
          <div className="text-center text-gray-600 text-lg">Nenhum evento encontrado.</div>
        )}

        {/* Lista de Eventos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onReserve={isAuthenticated && user?.role === 'USER' ? handleReserve : undefined}
              userRole={user?.role}
              isReserved={isEventReservedByUser(event.id)}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default HomePage;
