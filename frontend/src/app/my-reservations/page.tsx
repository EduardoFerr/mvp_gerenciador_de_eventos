// frontend/src/app/my-reservations/page.tsx
// Esta página exibe as reservas do usuário autenticado.

"use client"; // Marca este componente como um Componente Cliente.

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthContext';
import { Button } from '@/components/ui/button';
import { CalendarIcon, MapPinIcon, LinkIcon, XCircleIcon, CheckCircleIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Interface para o tipo de dados da reserva, correspondendo ao backend.
interface Reservation {
  id: string;
  eventId: string;
  userId: string;
  reservationDate: string;
  status: 'CONFIRMED' | 'CANCELED';
  event: { // Detalhes do evento aninhado
    id: string;
    name: string;
    eventDate: string;
    location: string | null;
    onlineLink: string | null;
  };
}

const MyReservationsPage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redireciona se não estiver autenticado ou não for um usuário comum
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'USER')) {
      router.push('/login'); // Redireciona para login se não for um USER logado
    }
  }, [isAuthenticated, authLoading, user, router]);


  const fetchMyReservations = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'USER') {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ reservations: Reservation[] }>('/reservations/my-reservations', { method: 'GET' });
      // Ordena as reservas por data do evento, com as confirmadas primeiro
      const sortedReservations = data.reservations.sort((a, b) => {
        // Reservas confirmadas vêm antes
        if (a.status === 'CONFIRMED' && b.status === 'CANCELED') return -1;
        if (a.status === 'CANCELED' && b.status === 'CONFIRMED') return 1;
        // Depois, ordena por data do evento (mais próximas primeiro)
        return new Date(a.event.eventDate).getTime() - new Date(b.event.eventDate).getTime();
      });
      setReservations(sortedReservations);
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar suas reservas.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === 'USER') {
      fetchMyReservations();
    }
  }, [authLoading, isAuthenticated, user, fetchMyReservations]);

  const handleCancelReservation = async (reservationId: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta reserva?')) {
      return;
    }

    try {
      const res = await apiFetch<{ message: string }>('/reservations/' + reservationId, {
        method: 'DELETE',
      });
      alert(res.message);
      fetchMyReservations(); // Recarrega as reservas após o cancelamento.
    } catch (err: any) {
      alert(err.message || 'Falha ao cancelar reserva.');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-lg text-gray-600">Carregando suas reservas...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-destructive text-lg font-semibold">{error}</div>
        </main>
      </div>
    );
  }

  // Se não for autenticado ou não for USER, o redirecionamento já ocorre, então este estado não deve ser alcançado.
  // Mas como fallback visual:
  if (!isAuthenticated || user?.role !== 'USER') {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Header />
          <main className="flex-grow flex items-center justify-center">
            <div className="text-lg text-gray-600">Acesso negado. Por favor, faça login como usuário.</div>
          </main>
        </div>
      );
  }


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold text-center text-primary-foreground mb-8">Minhas Reservas</h1>

        {reservations.length === 0 && (
          <div className="text-center text-gray-600 text-lg">Você não possui nenhuma reserva.</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reservations.map((reservation) => {
            const eventDateTime = new Date(reservation.event.eventDate);
            const formattedEventDate = eventDateTime.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            });
            const formattedEventTime = eventDateTime.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            });
            const reservationDateTime = new Date(reservation.reservationDate);
            const formattedReservationDate = reservationDateTime.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            });

            const isEventPast = eventDateTime < new Date();
            const canCancel = reservation.status === 'CONFIRMED' && !isEventPast;

            return (
              <div
                key={reservation.id}
                className={cn(
                  "bg-white border rounded-lg shadow-md p-6 flex flex-col gap-4",
                  reservation.status === 'CANCELED' ? 'opacity-70 border-dashed border-gray-400' : 'border-border',
                  "transition-transform duration-300 hover:scale-[1.02]"
                )}
              >
                <h2 className="text-xl font-semibold text-primary-foreground">{reservation.event.name}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CalendarIcon className="w-4 h-4 text-primary-foreground" />
                  <span>Evento em: {formattedEventDate} às {formattedEventTime}</span>
                </div>
                {reservation.event.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <MapPinIcon className="w-4 h-4 text-primary-foreground" />
                    <span>Local: {reservation.event.location}</span>
                  </div>
                )}
                {reservation.event.onlineLink && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <LinkIcon className="w-4 h-4 text-primary-foreground" />
                    <a href={reservation.event.onlineLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      Link Online
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CalendarIcon className="w-4 h-4 text-primary-foreground" />
                  <span>Reservado em: {formattedReservationDate}</span>
                </div>
                <div className="mt-auto pt-4 border-t border-border flex justify-between items-center">
                  {reservation.status === 'CONFIRMED' ? (
                    <span className="text-green-600 font-medium flex items-center gap-1">
                      <CheckCircleIcon className="w-5 h-5" /> Confirmada
                    </span>
                  ) : (
                    <span className="text-destructive font-medium flex items-center gap-1">
                      <XCircleIcon className="w-5 h-5" /> Cancelada
                    </span>
                  )}
                  {canCancel && (
                    <Button
                      onClick={() => handleCancelReservation(reservation.id)}
                      variant="destructive"
                      className="text-xs px-3 py-1"
                    >
                      Cancelar Reserva
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default MyReservationsPage;
