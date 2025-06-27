// frontend/src/app/admin/reservations/page.tsx
// Esta página permite aos administradores visualizarem todas as reservas de todos os eventos.

"use client"; // Marca este componente como um Componente Cliente.

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthContext';
import { Button } from '@/components/ui/button';
import { CalendarIcon, UserCircleIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react';
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
  };
  user: { // Detalhes do usuário aninhado
    id: string;
    email: string;
  };
}

const AdminReservationsPage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redireciona se não estiver autenticado ou não for um administrador
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'ADMIN')) {
      router.push('/'); // Redireciona para a home se não for um ADMIN logado
    }
  }, [isAuthenticated, authLoading, user, router]);

  const fetchAllReservations = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Para o admin, podemos listar todas as reservas do sistema.
      // A API que lista as reservas de um evento específico (/events/:id/reservations)
      // exigiria iterar por todos os eventos, o que não é ideal.
      // Precisamos de uma rota no backend que liste *todas* as reservas do sistema para o admin.
      // Como não criamos uma rota `GET /reservations` que lista *todas* as reservas para admin,
      // vamos adaptar. A maneira mais simples (para este MVP) é listar todas as reservas de todos os eventos.
      // No entanto, isso exigiria uma nova rota ou uma lógica mais complexa.
      // Para o MVP, vou simular listando por eventos.

      // Para simplificar, vou buscar todos os eventos e, para cada evento, buscar suas reservas.
      // Isso pode ser ineficiente para muitos eventos. Uma rota de API `GET /reservations` no backend seria melhor.
      // (Considerando a instrução de focar no MVP e fazer "arquivo por arquivo",
      // adicionar uma nova rota para 'GET /reservations' global pode ser um passo extra não explícito).

      // *** Adaptação: Vamos assumir uma rota genérica /api/reservations/all-admin
      // (que precisaria ser adicionada ao backend para ser mais eficiente,
      // ou se não houver tempo, o admin terá que ver por evento na rota já existente).

      // Para manter a consistência com o que já foi construído, e por MVP,
      // vou considerar que 'getEventReservations' é para um evento específico.
      // Se quisermos todas as reservas, o backend precisaria de um endpoint `/admin/reservations`.
      // Dada a restrição "arquivo por arquivo", vou assumir que uma rota de ADMIN
      // para todas as reservas pode ser simulada ou que o usuário testará por evento.

      // Vou adicionar uma nova rota de API no backend para `GET /admin/reservations`
      // para ter uma lista consolidada para esta página.
      // Por enquanto, farei uma requisição para listar todas as reservas de todos os eventos,
      // que será um pouco ineficiente mas funcional para um MVP.

      // ** Melhoria para MVP: Usaremos a rota GET /events e depois GET /events/:id/reservations
      // para cada evento. Isso não é escalável, mas funciona no escopo do MVP.

      const allEvents = await apiFetch<{ events: { id: string; name: string; eventDate: string; }[] }>('/events', { method: 'GET' });
      let allReservations: Reservation[] = [];

      for (const event of allEvents.events) {
        try {
          const eventReservations = await apiFetch<{ reservations: Reservation[] }>(`/reservations/events/${event.id}/reservations`, { method: 'GET' });
          // Anexa os detalhes do evento e usuário à reserva.
          const enrichedReservations = eventReservations.reservations.map(res => ({
            ...res,
            event: { id: event.id, name: event.name, eventDate: event.eventDate },
            user: res.user // Assumindo que a rota já retorna user.email
          }));
          allReservations = allReservations.concat(enrichedReservations);
        } catch (eventResErr: any) {
          console.warn(`Não foi possível carregar reservas para o evento ${event.name}:`, eventResErr.message);
        }
      }
      // Ordenar por data do evento e depois por data da reserva
      allReservations.sort((a, b) => {
        const eventDateA = new Date(a.event.eventDate).getTime();
        const eventDateB = new Date(b.event.eventDate).getTime();
        if (eventDateA !== eventDateB) {
          return eventDateA - eventDateB;
        }
        return new Date(a.reservationDate).getTime() - new Date(b.reservationDate).getTime();
      });

      setReservations(allReservations);

    } catch (err: any) {
      setError(err.message || 'Falha ao carregar reservas.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);


  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === 'ADMIN') {
      fetchAllReservations();
    }
  }, [authLoading, isAuthenticated, user, fetchAllReservations]);

  const handleCancelReservation = async (reservationId: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta reserva?')) {
      return;
    }

    try {
      const res = await apiFetch<{ message: string }>('/reservations/' + reservationId, {
        method: 'DELETE',
      });
      alert(res.message);
      fetchAllReservations(); // Recarrega as reservas após o cancelamento.
    } catch (err: any) {
      alert(err.message || 'Falha ao cancelar reserva.');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-lg text-gray-600">Carregando todas as reservas...</div>
        </main>
      </div>
    );
  }

  // Se não for autenticado ou não for ADMIN, o redirecionamento já ocorre, então este estado não deve ser alcançado.
  // Mas como fallback visual:
  if (!isAuthenticated || user?.role !== 'ADMIN') {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Header />
          <main className="flex-grow flex items-center justify-center">
            <div className="text-lg text-gray-600">Acesso negado. Apenas administradores podem ver todas as reservas.</div>
          </main>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold text-center text-primary-foreground mb-8">Gerenciar Todas as Reservas</h1>

        {error && (
          <div className="text-center text-destructive text-lg font-semibold mb-6">{error}</div>
        )}

        {reservations.length === 0 && !loading && !error && (
          <div className="text-center text-gray-600 text-lg">Nenhuma reserva encontrada no sistema.</div>
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
                  <UserCircleIcon className="w-4 h-4 text-primary-foreground" />
                  <span>Feita por: {reservation.user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CalendarIcon className="w-4 h-4 text-primary-foreground" />
                  <span>Evento em: {formattedEventDate} às {formattedEventTime}</span>
                </div>
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

export default AdminReservationsPage;
