// frontend/src/app/admin/events/page.tsx

"use client"; 

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarIcon, MapPinIcon, LinkIcon, UsersIcon, EditIcon, Trash2Icon, PlusCircleIcon, XCircleIcon } from 'lucide-react';
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

const AdminEventsPage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false); 
  const [isEditing, setIsEditing] = useState(false); 
  const [currentEvent, setCurrentEvent] = useState<Partial<Event> | null>(null); 
  const [modalError, setModalError] = useState<string | null>(null); 

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'ADMIN')) {
      router.push('/'); 
    }
  }, [isAuthenticated, authLoading, user, router]);

  const fetchEvents = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ events: Event[] }>('/events', { method: 'GET' });
      setEvents(data.events);
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar eventos.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === 'ADMIN') {
      fetchEvents();
    }
  }, [authLoading, isAuthenticated, user, fetchEvents]);

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setCurrentEvent({
      name: '',
      description: '',
      eventDate: new Date().toISOString().substring(0, 16), 
      location: '',
      onlineLink: '',
      maxCapacity: 1,
    });
    setModalError(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (event: Event) => {
    setIsEditing(true);
    setCurrentEvent({
      ...event,
      eventDate: new Date(event.eventDate).toISOString().substring(0, 16), 
      location: event.location || '', 
      onlineLink: event.onlineLink || '', 
    });
    setModalError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentEvent(null);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!currentEvent) return;

    let formattedEventDate = '';
    try {
      const dateObj = new Date(currentEvent.eventDate || '');
      if (isNaN(dateObj.getTime())) {
        setModalError('Data e hora do evento inválidas.');
        return;
      }
      formattedEventDate = dateObj.toISOString(); 
    } catch (dateError) {
      setModalError('Formato de data e hora inválido.');
      return;
    }


    const payload: any = {
      name: currentEvent.name,
      description: currentEvent.description || null, 
      eventDate: formattedEventDate,
      maxCapacity: currentEvent.maxCapacity ? Number(currentEvent.maxCapacity) : 1, 
    };

    if (currentEvent.location && currentEvent.location.trim() !== '') {
      payload.location = currentEvent.location.trim();
    } else {
      payload.location = null;
    }

    if (currentEvent.onlineLink && currentEvent.onlineLink.trim() !== '') {
      payload.onlineLink = currentEvent.onlineLink.trim();
    } else {
      payload.onlineLink = null;
    }

    if (!payload.name) {
      setModalError('O nome do evento é obrigatório.');
      return;
    }
    if (!payload.eventDate) {
      setModalError('A data e hora do evento são obrigatórias.');
      return;
    }
    if (payload.maxCapacity <= 0) {
      setModalError('A capacidade máxima deve ser um número positivo.');
      return;
    }
    if ((payload.location && payload.onlineLink) || (!payload.location && !payload.onlineLink)) {
      setModalError('O evento deve ter uma localização OU um link online, mas não ambos.');
      return;
    }

    try {
      if (isEditing && currentEvent.id) {
        await apiFetch(`/events/${currentEvent.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload), 
        });
        alert('Evento atualizado com sucesso!');
      } else {
        await apiFetch('/events', {
          method: 'POST',
          body: JSON.stringify(payload), 
        });
        alert('Evento criado com sucesso!');
      }
      fetchEvents(); 
      handleCloseModal();
    } catch (err: any) {
      if (err.errors && Array.isArray(err.errors)) {
        const errorMessages = err.errors.map((e: any) => e.message).join('; ');
        setModalError(`Falha na validação: ${errorMessages}`);
      } else {
        setModalError(err.message || 'Falha ao salvar evento.');
      }
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Tem certeza que deseja deletar este evento? Todas as reservas associadas também serão removidas.')) {
      return;
    }

    try {
      await apiFetch(`/events/${eventId}`, {
        method: 'DELETE',
      });
      alert('Evento deletado com sucesso!');
      fetchEvents(); 
    } catch (err: any) {
      alert(err.message || 'Falha ao deletar evento.');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-lg text-muted-foreground">Carregando eventos para administração...</div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-lg text-muted-foreground">Acesso negado. Apenas administradores podem gerenciar eventos.</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold text-center text-foreground mb-8">Gerenciar Eventos</h1>

        <div className="bg-card p-6 rounded-md mb-6 flex justify-end">
          <Button onClick={handleOpenCreateModal} className="flex items-center gap-2">
            <PlusCircleIcon className="h-5 w-5" /> Criar Novo Evento
          </Button>
        </div>

        {error && (
          <div className="text-center text-destructive text-lg font-semibold mb-6">{error}</div>
        )}

        {events.length === 0 && !loading && !error && (
          <div className="text-center text-muted-foreground text-lg">Nenhum evento para gerenciar.</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const eventDateTime = new Date(event.eventDate);
            const formattedDate = eventDateTime.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const formattedTime = eventDateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={event.id}
                className="bg-card border border-border rounded-md p-6 flex flex-col gap-4 transition-transform duration-300 hover:scale-[1.02]" 
              >
                <h2 className="text-xl font-semibold text-foreground">{event.name}</h2>
                <p className="text-muted-foreground text-sm line-clamp-2">{event.description}</p>
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
                      <a href={event.onlineLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        Link Online
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <UsersIcon className="w-4 h-4 text-primary" />
                    <span>{event.availableSpots} / {event.maxCapacity} vagas</span>
                  </div>
                </div>
                <div className="mt-auto pt-4 border-t border-border flex justify-end gap-2">
                  <Button onClick={() => handleOpenEditModal(event)} variant="secondary" size="sm">
                    <EditIcon className="w-4 h-4 mr-1" /> Editar
                  </Button>
                  <Button onClick={() => handleDeleteEvent(event.id)} variant="destructive" size="sm">
                    <Trash2Icon className="w-4 h-4 mr-1" /> Deletar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal para Criar/Editar Evento */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-md p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold text-center text-foreground mb-6">
                {isEditing ? 'Editar Evento' : 'Criar Novo Evento'}
              </h2>
              <form onSubmit={handleModalSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">Nome do Evento</label>
                  <Input
                    id="name"
                    type="text"
                    value={currentEvent?.name || ''}
                    onChange={(e) => setCurrentEvent({ ...currentEvent, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">Descrição</label>
                  <textarea
                    id="description"
                    rows={3}
                    value={currentEvent?.description || ''}
                    onChange={(e) => setCurrentEvent({ ...currentEvent, description: e.target.value })}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  ></textarea>
                </div>
                <div>
                  <label htmlFor="eventDate" className="block text-sm font-medium text-foreground mb-1">Data e Hora do Evento</label>
                  <Input
                    id="eventDate"
                    type="datetime-local"
                    value={currentEvent?.eventDate || ''}
                    onChange={(e) => setCurrentEvent({ ...currentEvent, eventDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="maxCapacity" className="block text-sm font-medium text-foreground mb-1">Capacidade Máxima</label>
                  <Input
                    id="maxCapacity"
                    type="number"
                    value={currentEvent?.maxCapacity || 1}
                    onChange={(e) => setCurrentEvent({ ...currentEvent, maxCapacity: Number(e.target.value) })}
                    min={1}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-foreground mb-1">Local (para eventos presenciais)</label>
                    <Input
                      id="location"
                      type="text"
                      placeholder="Auditório Principal"
                      value={currentEvent?.location || ''}
                      onChange={(e) => setCurrentEvent({ ...currentEvent, location: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="onlineLink" className="block text-sm font-medium text-foreground mb-1">Link Online (para eventos online)</label>
                    <Input
                      id="onlineLink"
                      type="url"
                      placeholder="https://meet.google.com/..."
                      value={currentEvent?.onlineLink || ''}
                      onChange={(e) => setCurrentEvent({ ...currentEvent, onlineLink: e.target.value })}
                    />
                  </div>
                </div>
                {modalError && <p className="text-destructive text-sm text-center mt-2">{modalError}</p>}
                <div className="flex justify-end gap-3 mt-6">
                  <Button type="button" variant="outline" onClick={handleCloseModal}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {isEditing ? 'Salvar Alterações' : 'Criar Evento'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminEventsPage;
