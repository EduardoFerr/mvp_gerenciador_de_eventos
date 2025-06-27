// frontend/src/components/EventCard.tsx
// Este componente exibe os detalhes de um único evento em um formato de cartão.

"use client"; // Marca este componente como um Componente Cliente.

import React from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { CalendarIcon, MapPinIcon, LinkIcon, UsersIcon } from 'lucide-react'; // Ícones para melhor UX
import { useAuth } from '@/components/AuthContext'; // Importa o useAuth para acessar o contexto de autenticação.

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

// Props para o componente EventCard.
interface EventCardProps {
  event: Event;
  onReserve?: (eventId: string) => void; // Função para lidar com a reserva (opcional)
  userRole?: 'USER' | 'ADMIN' | null; // Papel do usuário logado (opcional)
  isReserved?: boolean; // Indica se o usuário já reservou este evento (opcional)
  className?: string; // Para estilização adicional
}

const EventCard: React.FC<EventCardProps> = ({ event, onReserve, userRole, isReserved, className }) => {
  // Desestrutura isAuthenticated do useAuth() para uso no componente.
  const { isAuthenticated } = useAuth(); 

  // Formata a data e hora do evento para exibição.
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

  // Lógica para determinar se o botão de reserva deve ser exibido/habilitado.
  const canUserAttemptReserve = userRole === 'USER' && !isEventPast && onReserve !== undefined;

  // Texto e estado do botão de reserva
  let buttonText = 'Reservar Vaga';
  let isButtonDisabled = false; // Estado para o botão de reserva direto

  if (isEventPast) {
    buttonText = 'Evento Encerrado';
    isButtonDisabled = true;
  } else if (!isSpotsAvailable) {
    buttonText = 'Vagas Esgotadas';
    isButtonDisabled = true;
  } else if (isReserved) {
    buttonText = 'Vaga Reservada';
    isButtonDisabled = true;
  }


  return (
    <div className={cn(
      "bg-card text-card-foreground border border-border rounded-md overflow-hidden", // Removido shadow-lg, ajustado rounded-md
      "transition-transform duration-300 hover:scale-[1.02]",
      "flex flex-col",
      className
    )}>
      <div className="p-6 flex-grow">
        <h3 className="text-xl font-semibold mb-2">
          <Link href={`/events/${event.id}`} className="hover:underline text-primary-foreground">
            {event.name}
          </Link>
        </h3>
        {event.description && (
          <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
            {event.description}
          </p>
        )}

        <div className="space-y-2 text-sm text-foreground/80">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-primary-foreground" />
            <span>{formattedDate} às {formattedTime}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPinIcon className="w-4 h-4 text-primary-foreground" />
              <span>{event.location}</span>
            </div>
          )}
          {event.onlineLink && (
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-primary-foreground" />
              <a
                href={event.onlineLink}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline text-blue-500"
              >
                Link Online
              </a>
            </div>
          )}
          <div className="flex items-center gap-2">
            <UsersIcon className="w-4 h-4 text-primary-foreground" />
            <span>{event.availableSpots} / {event.maxCapacity} vagas disponíveis</span>
          </div>
        </div>
      </div>
      <div className="p-6 pt-0 border-t border-border mt-4 flex items-center justify-between">
        {userRole === 'ADMIN' ? (
          // Para ADMINs, sempre um link para gerenciar o evento.
          <Button asChild className="w-full sm:w-auto">
            <Link href={`/admin/events`}> {/* Admins vão para a página de gerenciamento de eventos */}
              Gerenciar Evento
            </Link>
          </Button>
        ) : isAuthenticated && userRole === 'USER' ? (
          // Para USUÁRIOS autenticados, o botão de reserva com lógica de estado
          <Button
            onClick={() => onReserve && onReserve(event.id)}
            className="w-full sm:w-auto"
            disabled={isButtonDisabled}
          >
            {buttonText}
          </Button>
        ) : (
          // Para usuários NÃO AUTENTICADOS, um link para login
          <Button asChild className="w-full sm:w-auto">
            <Link href="/login">
              Faça Login para Reservar
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};

export default EventCard;
