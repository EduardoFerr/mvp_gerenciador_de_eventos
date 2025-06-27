// frontend/src/app/page.tsx

"use client"; 

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import EventCard from '@/components/EventCard';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CalendarDaysIcon, SearchIcon, XCircleIcon } from 'lucide-react'; 
import { cn } from '@/lib/utils'; 


interface Event {
  id: string;
  name: string;
  description: string | null;
  eventDate: string; 
  location: string | null;
  onlineLink: string | null;
  maxCapacity: number;
  availableSpots: number;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}

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

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
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

  const fetchMyReservations = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'USER') {
      setMyReservations([]);
      return;
    }
    try {
      const data = await apiFetch<{ reservations: Reservation[] }>('/reservations/my-reservations', { method: 'GET' });
      setMyReservations(data.reservations.filter(res => res.status === 'CONFIRMED'));
    } catch (err: any) {
      console.error('Falha ao carregar minhas reservas:', err);
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (!authLoading) {
      fetchMyReservations();
    }
  }, [authLoading, fetchMyReservations]);

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
      const res = await apiFetch<{ message: string; reservation: Reservation }>(`/reservations/events/${eventId}/reserve`, {
        method: 'POST',
      });
      alert(res.message);
      fetchEvents();
      fetchMyReservations();
    } catch (err: any) {
      alert(err.message || 'Falha ao reservar vaga.');
    }
  };

  const handleClearFilters = () => {
    setFilterName('');
    setFilterDate('');
  };

  const isEventReservedByUser = (eventId: string): boolean => {
    if (!isAuthenticated || user?.role !== 'USER') return false;
    return myReservations.some(res => res.eventId === eventId && res.userId === user?.id && res.status === 'CONFIRMED');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col"> 
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold text-center text-foreground mb-8">Eventos Disponíveis</h1> 

        <div className="bg-card p-6 rounded-md mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 items-end"> 
          <div>
            <label htmlFor="filterName" className="block text-sm font-medium text-foreground mb-1"> 
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
            <label htmlFor="filterDate" className="block text-sm font-medium text-foreground mb-1"> 
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

        {loading && (
          <div className="text-center text-muted-foreground text-lg">Carregando eventos...</div> 
        )}
        {error && (
          <div className="text-center text-destructive text-lg font-semibold">{error}</div>
        )}
        {!loading && !error && events.length === 0 && (
          <div className="text-center text-muted-foreground text-lg">Nenhum evento encontrado.</div> 
        )}

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
