// frontend/src/app/events/[id]/page.tsx
// Esta página exibe os detalhes de um evento específico.

"use client"; // Marca este componente como um Componente Cliente.

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthContext';
import { Button } from '@/components/ui/button';
import { CalendarIcon, MapPinIcon, LinkIcon, UsersIcon, UserCircleIcon, ClockIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Interface para o tipo de dados do evento.
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
  creator: {
    id: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Interface para o tipo de dados da reserva.
interface Reservation {
  id: string;
  eventId: string;
  userId: string;
  reservationDate: string;
  status: 'CONFIRMED' | 'CANCELED';
}

const EventDetailPage: React.FC<{ params: { id: string } }> = ({ params }) => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const eventId = params.id;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReserved, setIsReserved] = useState(false);
  const [isReserving, setIsReserving] = useState(false);
  const [reservationMessage, setReservationMessage] = useState<string | null>(null); // Para mensagens de sucesso/erro da reserva

  // Função para buscar os detalhes do evento.
  const fetchEventDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ event: Event }>(`/events/${eventId}`);
      setEvent(data.event);
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar detalhes do evento.');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  // Função para verificar se o usuário atual já tem uma reserva para este evento.
  const checkUserReservation = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'USER') {
      setIsReserved(false);
      return;
    }
    try {
      const data = await apiFetch<{ reservations: Reservation[] }>('/reservations/my-reservations', { method: 'GET' });
      const found = data.reservations.some(
        (res) => res.eventId === eventId && res.userId === user.id && res.status === 'CONFIRMED'
      );
      setIsReserved(found);
    } catch (err: any) {
      console.error('Erro ao verificar reservas do usuário:', err);
      setIsReserved(false); // Assume que não está reservado em caso de erro.
    }
  }, [isAuthenticated, eventId, user]);

  // Efeito para carregar os detalhes do evento e verificar a reserva do usuário.
  useEffect(() => {
    fetchEventDetails();
  }, [fetchEventDetails]);

  // Efeito para verificar a reserva do usuário após a autenticação ser carregada.
  useEffect(() => {
    if (!authLoading) {
      checkUserReservation();
    }
  }, [authLoading, checkUserReservation]);

  // Função para lidar com a reserva de um evento.
  const handleReserve = async () => {
    if (!isAuthenticated) {
      setReservationMessage('Você precisa estar logado para reservar uma vaga.');
      router.push('/login');
      return;
    }
    if (user?.role !== 'USER') {
      setReservationMessage('Apenas usuários comuns podem fazer reservas.');
      return;
    }
    if (!event || event.availableSpots <= 0) {
      setReservationMessage('Não há vagas disponíveis ou o evento não foi encontrado.');
      return;
    }
    if (isReserved) {
      setReservationMessage('Você já tem uma reserva para este evento.');
      return;
    }
    if (new Date(event.eventDate) < new Date()) {
      setReservationMessage('Não é possível reservar vagas para um evento que já ocorreu.');
      return;
    }

    setIsReserving(true);
    setReservationMessage(null); // Limpa mensagens anteriores
    try {
      const res = await apiFetch<{ message: string; reservation: Reservation }>(`/reservations/events/${eventId}/reserve`, {
        method: 'POST',
      });
      setReservationMessage(res.message);
      // Atualiza o estado local do evento para refletir as vagas diminuídas.
      if (event) {
        setEvent(prevEvent => prevEvent ? { ...prevEvent, availableSpots: prevEvent.availableSpots - 1 } : null);
      }
      setIsReserved(true); // Marca como reservado.
    } catch (err: any) {
      // Mensagem de erro mais específica, tratando o caso de reserva duplicada do backend
      if (err.message && err.message.includes('você já possui uma reserva confirmada')) {
        setReservationMessage('Falha na reserva: Você já possui uma reserva confirmada para este evento.');
        setIsReserved(true); // Garante que o estado seja atualizado
      } else if (err.message && err.message.includes('não há mais vagas disponíveis')) {
        setReservationMessage('Falha na reserva: Não há mais vagas disponíveis.');
      } else {
        setReservationMessage(err.message || 'Falha ao reservar vaga. Por favor, tente novamente.');
      }
    } finally {
      setIsReserving(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-lg text-gray-600">Carregando detalhes do evento...</div>
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

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-gray-600 text-lg">Evento não encontrado.</div>
        </main>
      </div>
    );
  }

  const eventDateTime = new Date(event.eventDate);
  const formattedDate = eventDateTime.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedTime = eventDateTime.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isEventPast = eventDateTime < new Date();
  const isSpotsAvailable = event.availableSpots > 0;
  const canReserveLogic = user?.role === 'USER' && isSpotsAvailable && !isReserved && !isEventPast;

  // Lógica para o texto e estado do botão de reserva na página de detalhes
  let buttonText = 'Reservar Minha Vaga';
  let isButtonDisabled = isReserving;
  let reservationStatusMessage: string | null = null;

  if (isEventPast) {
    reservationStatusMessage = 'Evento Encerrado';
    isButtonDisabled = true;
  } else if (!isSpotsAvailable) {
    reservationStatusMessage = 'Vagas Esgotadas!';
    isButtonDisabled = true;
  } else if (isReserved) {
    reservationStatusMessage = 'Você já possui uma reserva confirmada para este evento!';
    isButtonDisabled = true;
  } else if (!isAuthenticated) {
    reservationStatusMessage = 'Faça login para reservar uma vaga.';
    isButtonDisabled = true; // Desabilita o botão para usuários não autenticados
    buttonText = 'Entrar para Reservar';
  } else if (user?.role === 'ADMIN') {
    reservationStatusMessage = 'Administradores não podem reservar vagas.';
    isButtonDisabled = true;
    buttonText = 'Ação de Administrador'; // Texto genérico para admins
  } else {
    // Se nenhuma das condições acima for atendida, o botão está habilitado para reserva
    isButtonDisabled = isReserving;
  }


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-primary-foreground mb-4 text-center">{event.name}</h1>
          <p className="text-muted-foreground text-center mb-6">{event.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-lg mb-8">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-6 h-6 text-primary-foreground" />
              <span>Data: {formattedDate}</span>
            </div>
            <div className="flex items-center gap-3">
              <ClockIcon className="w-6 h-6 text-primary-foreground" />
              <span>Hora: {formattedTime}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-3">
                <MapPinIcon className="w-6 h-6 text-primary-foreground" />
                <span>Local: {event.location}</span>
              </div>
            )}
            {event.onlineLink && (
              <div className="flex items-center gap-3">
                <LinkIcon className="w-6 h-6 text-primary-foreground" />
                <span>Link Online: <a href={event.onlineLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{event.onlineLink}</a></span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <UsersIcon className="w-6 h-6 text-primary-foreground" />
              <span>Vagas: {event.availableSpots} / {event.maxCapacity}</span>
            </div>
            <div className="flex items-center gap-3">
              <UserCircleIcon className="w-6 h-6 text-primary-foreground" />
              <span>Criado por: {event.creator.email}</span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border flex flex-col items-center gap-4">
            {reservationMessage && (
              <p className={cn(
                "text-md font-medium text-center",
                reservationMessage.includes('Falha') || reservationMessage.includes('não pode') ? 'text-destructive' : 'text-green-600'
              )}>
                {reservationMessage}
              </p>
            )}

            {/* Exibe a mensagem de status da reserva acima do botão */}
            {reservationStatusMessage && !reservationMessage && ( // Só exibe se não houver uma mensagem de reserva ativa
                <span className={cn(
                    "text-xl font-medium",
                    isEventPast || !isSpotsAvailable ? 'text-destructive' : isReserved ? 'text-green-600' : 'text-gray-600'
                )}>
                    {reservationStatusMessage}
                </span>
            )}

            {user?.role === 'USER' && (
              <Button
                onClick={handleReserve}
                disabled={isButtonDisabled} // Usa o estado calculado
                className="w-full max-w-xs"
              >
                {isReserving ? 'Reservando...' : buttonText}
              </Button>
            )}

            {!isAuthenticated && ( // Exibe link de login apenas se não autenticado e não for admin
                <p className="text-gray-600 text-sm">
                    <Link href="/login" className="text-primary-foreground hover:underline">Faça login</Link> para reservar uma vaga.
                </p>
            )}

            <Button variant="outline" onClick={() => router.push('/')} className="w-full max-w-xs mt-4">
              Voltar para Eventos
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EventDetailPage;
