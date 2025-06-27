// backend/src/controllers/eventController.ts
// Este arquivo contém a lógica para o gerenciamento de eventos.

import { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client'; // Role agora será importado corretamente
import { createEventSchema, updateEventSchema } from '../validation/schemas';
import { ZodError } from 'zod';
import { prisma } from '../server'; // Importa a instância do Prisma do server.ts
import { redisClient } from '../config/redis'; // Importa o cliente Redis

const EVENT_CACHE_PREFIX = 'event:';
const EVENT_LIST_CACHE_KEY = 'events:list';

/**
 * Cria um novo evento. (Apenas Admin)
 * O `availableSpots` é inicializado com `maxCapacity`.
 */
export const createEvent = async (req: Request, res: Response) => {
  try {
    // 1. Valida os dados de entrada com o schema Zod.
    const eventData = createEventSchema.parse(req.body);
    // Campos agora podem ser undefined ou null se não forem fornecidos no payload.
    const { name, description, eventDate, location, onlineLink, maxCapacity } = eventData;

    // 2. Garante que a requisição está sendo feita por um Admin.
    if (req.role !== Role.ADMIN) {
      return res.status(403).json({ message: 'Acesso negado: Apenas administradores podem criar eventos.' });
    }

    // A validação de "location OU onlineLink" já é feita no schema Zod (createEventSchema).
    // Nao precisamos de um if extra aqui, pois o parse do Zod ja lida com isso.

    // 3. Cria o evento no banco de dados.
    const newEvent = await prisma.event.create({
      data: {
        name,
        description: description ?? null, // Converte undefined para null para o DB
        eventDate: new Date(eventDate), // eventDate é string e obrigatório pelo schema
        location: location ?? null, // Converte undefined para null para o DB
        onlineLink: onlineLink ?? null, // Converte undefined para null para o DB
        maxCapacity, // maxCapacity é number e obrigatório pelo schema
        availableSpots: maxCapacity, // Inicialmente, vagas disponíveis = capacidade máxima
        creatorId: req.userId!, // ID do admin que criou o evento (guaranteed pelo middleware de autenticação)
      },
    });

    // 4. Invalida o cache da lista de eventos.
    await redisClient.del(EVENT_LIST_CACHE_KEY);

    // 5. Envia a resposta de sucesso.
    res.status(201).json({ message: 'Evento criado com sucesso!', event: newEvent });
  } catch (error) {
    // Lida com erros de validação Zod.
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Erro de validação.', errors: (error as ZodError).errors });
    }
    // Lida com outros erros.
    console.error('Erro ao criar evento:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao criar evento.' });
  }
};

/**
 * Lista todos os eventos.
 * Pode ser filtrado por nome e data.
 * Implementa cache com Redis.
 */
export const listEvents = async (req: Request, res: Response) => {
  try {
    const { name, date } = req.query; // Parâmetros de filtro
    let events;

    // Tenta buscar do cache primeiro para a lista completa sem filtros
    if (!name && !date) {
      const cachedEvents = await redisClient.get(EVENT_LIST_CACHE_KEY);
      if (cachedEvents) {
        console.log('Eventos da lista obtidos do cache.');
        return res.status(200).json({ events: JSON.parse(cachedEvents) });
      }
    }

    const where: any = {};
    if (name) {
      where.name = { contains: name as string, mode: 'insensitive' }; // Busca por nome (case-insensitive)
    }
    if (date) {
      const parsedDate = new Date(date as string);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: 'Formato de data inválido. Use AAAA-MM-DD.' });
      }
      // Filtra por data (do início do dia até o final do dia)
      const startOfDay = new Date(parsedDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(parsedDate.setHours(23, 59, 59, 999));
      where.eventDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    events = await prisma.event.findMany({
      where,
      orderBy: { eventDate: 'asc' }, // Ordena por data do evento
      include: {
        creator: {
          select: { id: true, email: true } // Inclui informações básicas do criador
        }
      }
    });

    // Armazena no cache se não houver filtros
    if (!name && !date) {
      await redisClient.setEx(EVENT_LIST_CACHE_KEY, 3600, JSON.stringify(events)); // Cache por 1 hora
      console.log('Eventos da lista armazenados no cache.');
    }

    res.status(200).json({ events });
  } catch (error) {
    console.error('Erro ao listar eventos:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao listar eventos.' });
  }
};

/**
 * Obtém detalhes de um evento específico.
 * Implementa cache com Redis para eventos individuais.
 */
export const getEventById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 1. Tenta buscar do cache Redis primeiro.
    const cachedEvent = await redisClient.get(`${EVENT_CACHE_PREFIX}${id}`);
    if (cachedEvent) {
      console.log(`Evento ${id} obtido do cache.`);
      return res.status(200).json({ event: JSON.parse(cachedEvent) });
    }

    // 2. Se não estiver no cache, busca no banco de dados.
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, email: true }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ message: 'Evento não encontrado.' });
    }

    // 3. Armazena o evento no cache Redis por 1 hora.
    await redisClient.setEx(`${EVENT_CACHE_PREFIX}${id}`, 3600, JSON.stringify(event));
    console.log(`Evento ${id} armazenado no cache.`);

    res.status(200).json({ event });
  } catch (error) {
    console.error('Erro ao obter evento por ID:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao obter evento.' });
  }
};

/**
 * Atualiza um evento existente. (Apenas Admin)
 * `availableSpots` é recalculado se `maxCapacity` mudar.
 */
export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // 1. Valida os dados de entrada com o schema Zod (partial para atualização).
    const eventData = updateEventSchema.parse(req.body);
    // Campos agora podem ser undefined ou null se não forem fornecidos no payload.
    const { name, description, eventDate, location, onlineLink, maxCapacity } = eventData;

    // 2. Garante que a requisição está sendo feita por um Admin.
    if (req.role !== Role.ADMIN) {
      return res.status(403).json({ message: 'Acesso negado: Apenas administradores podem atualizar eventos.' });
    }

    // 3. Obtém o evento atual para verificar a existência e creatorId.
    const existingEvent = await prisma.event.findUnique({
      where: { id },
      select: { creatorId: true, maxCapacity: true, availableSpots: true, location: true, onlineLink: true }
    });

    if (!existingEvent) {
      return res.status(404).json({ message: 'Evento não encontrado para atualização.' });
    }

    // Lógica para determinar a localização e o link online atualizados.
    // Se o campo for explicitamente fornecido no payload (mesmo que seja null ou string vazia), use-o.
    // Caso contrário, mantenha o valor existente do evento.
    const finalLocation: string | null = location !== undefined ? (location === null || location.trim() === '' ? null : location.trim()) : existingEvent.location;
    const finalOnlineLink: string | null = onlineLink !== undefined ? (onlineLink === null || onlineLink.trim() === '' ? null : onlineLink.trim()) : existingEvent.onlineLink;


    // A validação de "location OU onlineLink, mas não ambos"
    // para o estado FINAL do evento.
    const hasFinalLocation = finalLocation !== null && finalLocation !== ''; // Verificação mais robusta para string vazia
    const hasFinalOnlineLink = finalOnlineLink !== null && finalOnlineLink !== ''; // Verificação mais robusta para string vazia

    if (!hasFinalLocation && !hasFinalOnlineLink) {
      return res.status(400).json({ message: 'O evento deve ter uma localização ou um link online.' });
    }
    if (hasFinalLocation && hasFinalOnlineLink) {
      return res.status(400).json({ message: 'O evento não pode ter localização e link online simultaneamente.' });
    }


    let newAvailableSpots: number | undefined = undefined; // Initialize as undefined
    // CORREÇÃO: Garante que maxCapacity é um número antes de usar em aritmética
    // e que existingEvent.maxCapacity também é um número
    if (typeof maxCapacity === 'number' && typeof existingEvent.maxCapacity === 'number') {
      if (maxCapacity !== existingEvent.maxCapacity) {
        const delta = maxCapacity - existingEvent.maxCapacity;
        newAvailableSpots = existingEvent.availableSpots + delta;
        newAvailableSpots = Math.max(0, newAvailableSpots);
      } else {
        newAvailableSpots = existingEvent.availableSpots; // If maxCapacity didn't change, keep available spots as is.
      }
    }


    // 4. Constrói o objeto de dados para atualização.
    // Definimos explicitamente o tipo da dataToUpdate para que o TypeScript possa verificar.
    const dataToUpdate: {
      name?: string;
      description?: string | null;
      eventDate?: Date; 
      location?: string | null;
      onlineLink?: string | null;
      maxCapacity?: number;
      availableSpots?: number;
    } = {};

    if (name !== undefined) dataToUpdate.name = name;
    // Para description: se o valor é `undefined` no payload, não o inclui na atualização.
    // Se o valor é `null` ou `string`, inclui e usa `?? null` para garantir `null` para o DB.
    if (description !== undefined) {
      dataToUpdate.description = description ?? null; 
    }
    
    // CORREÇÃO: Apenas crie Date se eventDate for uma string válida
    // O campo eventDate no DB é OBRIGATÓRIO (não nullable no schema.prisma),
    // então se eventDate for fornecido (não undefined), ele deve ser uma string válida para new Date().
    if (eventDate !== undefined) { 
        dataToUpdate.eventDate = new Date(eventDate as string); // Explicitly cast to string here as Zod already validated it
    } 
    // If eventDate is undefined in the payload, it is not added to dataToUpdate,
    // and the existing value in the DB is maintained.

    // Usa os valores já validados de finalLocation e finalOnlineLink.
    // Atribua se eles foram explicitamente passados (diferente de undefined no payload)
    if (location !== undefined) {
        dataToUpdate.location = finalLocation;
    }
    if (onlineLink !== undefined) {
        dataToUpdate.onlineLink = finalOnlineLink;
    }

    // CORREÇÃO: Apenas atribua maxCapacity e availableSpots se maxCapacity foi fornecido
    if (typeof maxCapacity === 'number') {
      dataToUpdate.maxCapacity = maxCapacity;
      if (newAvailableSpots !== undefined) { // newAvailableSpots só é calculado se maxCapacity foi um número válido
        dataToUpdate.availableSpots = newAvailableSpots; 
      }
    }


    // 5. Atualiza o evento no banco de dados.
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: dataToUpdate,
    });

    // 6. Invalida o cache do evento individual e da lista de eventos.
    await redisClient.del(`${EVENT_CACHE_PREFIX}${id}`);
    await redisClient.del(EVENT_LIST_CACHE_KEY);

    // 7. Envia a resposta de sucesso.
    res.status(200).json({ message: 'Evento atualizado com sucesso!', event: updatedEvent });
  } catch (error) {
    // Lida com erros de validação Zod.
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Erro de validação.', errors: error.errors });
    }
    // Lida com outros erros.
    console.error('Erro ao atualizar evento:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao atualizar evento.' });
  }
};

/**
 * Deleta um evento. (Apenas Admin)
 * Todas as reservas associadas a este evento também serão deletadas (configurado no schema.prisma).
 */
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 1. Garante que a requisição está sendo feita por um Admin.
    if (req.role !== Role.ADMIN) {
      return res.status(403).json({ message: 'Acesso negado: Apenas administradores podem deletar eventos.' });
    }

    // 2. Verifica se o evento existe antes de tentar deletar.
    const existingEvent = await prisma.event.findUnique({ where: { id } });
    if (!existingEvent) {
      return res.status(404).json({ message: 'Evento não encontrado para exclusão.' });
    }

    // 3. Deleta o evento. Devido ao `onDelete: Cascade` configurado no schema para `reservations` em `Event`,
    // todas as reservas associadas serão deletadas automaticamente pelo banco de dados.
    await prisma.event.delete({ where: { id } });

    // 4. Invalida o cache do evento individual e da lista de eventos.
    await redisClient.del(`${EVENT_CACHE_PREFIX}${id}`);
    await redisClient.del(EVENT_LIST_CACHE_KEY);

    // 5. Envia a resposta de sucesso.
    res.status(200).json({ message: 'Evento deletado com sucesso!' });
  }
   catch (error: any) {
    // Lida com erro de chave estrangeira se o onDelete não for CASCADE e houver reservas.
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Não é possível deletar o evento devido a reservas associadas.' });
    }
    console.error('Erro ao deletar evento:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao deletar evento.' });
  }
};