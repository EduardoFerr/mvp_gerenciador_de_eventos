// frontend/src/components/EventCard.tsx

"use client"; 

import React from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { CalendarIcon, MapPinIcon, LinkIcon, UsersIcon } from 'lucide-react'; 
import { useAuth } from '@/components/AuthContext'; 

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

interface EventCardProps {
  event: Event;
  onReserve?: (eventId: string) => void; 
  userRole?: 'USER' | 'ADMIN' | null; 
  isReserved?: boolean; 
  className?: string; 
}

const EventCard: React.FC<EventCardProps> = ({ event, onReserve, userRole, isReserved, className }) => {
  const { isAuthenticated } = useAuth(); 

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

  const canUserAttemptReserve = userRole === 'USER' && !isEventPast && onReserve !== undefined;

  let buttonText = 'Reservar Vaga';
  let isButtonDisabled = false;

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
      "bg-card text-card-foreground border border-border rounded-lg shadow-md overflow-hidden",
      "transition-transform duration-300 hover:scale-[1.02]",
      "flex flex-col",
      className
    )}>
      <div className="p-6 flex-grow">
        <h3 className="text-xl font-semibold mb-2">
          <Link href={`/events/${event.id}`} className="text-xl font-semibold text-foreground"> 
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
            <CalendarIcon className="w-4 h-4 text-primary" />
            <span>{formattedDate} às {formattedTime}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPinIcon className="w-4 h-4 text-primary" />
              <span>{event.location}</span>
            </div>
          )}
          {event.onlineLink && (
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-primary" /> 
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
            <UsersIcon className="w-4 h-4 text-primary" /> 
            <span>{event.availableSpots} / {event.maxCapacity} vagas disponíveis</span>
          </div>
        </div>
      </div>
      <div className="p-6 border-t border-border mt-4 flex items-center justify-between">
        {userRole === 'ADMIN' ? (
          <Button asChild className="w-full sm:w-auto">
            <Link href={`/admin/events`}> 
              Gerenciar Evento
            </Link>
          </Button>
        ) : isAuthenticated && userRole === 'USER' ? (
          <Button
            onClick={() => onReserve && onReserve(event.id)}
            className="w-full sm:w-auto"
            disabled={isButtonDisabled}
          >
            {buttonText}
          </Button>
        ) : (
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
