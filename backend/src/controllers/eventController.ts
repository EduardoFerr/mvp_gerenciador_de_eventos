import { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { createEventSchema, updateEventSchema } from '../validation/schemas';
import { ZodError } from 'zod';
import { prisma } from '../services/prisma';
import { redisClient } from '../config/redis';

const EVENT_CACHE_PREFIX = 'event:';
const EVENT_LIST_CACHE_KEY = 'events:list';

export const createEvent = async (req: Request, res: Response) => {
  try {
    const eventData = createEventSchema.parse(req.body);
    const { name, description, eventDate, location, onlineLink, maxCapacity } = eventData;

    if (req.role !== Role.ADMIN) {
      return res.status(403).json({ message: 'Acesso negado: Apenas administradores podem criar eventos.' });
    }

    const newEvent = await prisma.event.create({
      data: {
        name,
        description: description ?? null,
        eventDate: new Date(eventDate),
        location: location ?? null,
        onlineLink: onlineLink ?? null,
        maxCapacity,
        availableSpots: maxCapacity,
        creatorId: req.userId!,
      },
    });

    await redisClient.del(EVENT_LIST_CACHE_KEY);

    res.status(201).json({ message: 'Evento criado com sucesso!', event: newEvent });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Erro de validação.', errors: error.errors });
    }
    console.error('Erro ao criar evento:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao criar evento.' });
  }
};

export const listEvents = async (req: Request, res: Response) => {
  try {
    const { name, date } = req.query;
    let events;

    if (!name && !date) {
      const cachedEvents = await redisClient.get(EVENT_LIST_CACHE_KEY);
      if (cachedEvents) {
        return res.status(200).json({ events: JSON.parse(cachedEvents) });
      }
    }

    const where: any = {};
    if (name) {
      where.name = { contains: name as string, mode: 'insensitive' };
    }
    if (date) {
      const parsedDate = new Date(date as string);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: 'Formato de data inválido. Use AAAA-MM-DD.' });
      }
      const startOfDay = new Date(parsedDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(parsedDate.setHours(23, 59, 59, 999));
      where.eventDate = { gte: startOfDay, lte: endOfDay };
    }

    events = await prisma.event.findMany({
      where,
      orderBy: { eventDate: 'asc' },
      include: {
        creator: { select: { id: true, email: true } }
      }
    });

    if (!name && !date) {
      await redisClient.setEx(EVENT_LIST_CACHE_KEY, 3600, JSON.stringify(events));
    }

    res.status(200).json({ events });
  } catch (error) {
    console.error('Erro ao listar eventos:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao listar eventos.' });
  }
};

export const getEventById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const cachedEvent = await redisClient.get(`${EVENT_CACHE_PREFIX}${id}`);
    if (cachedEvent) {
      return res.status(200).json({ event: JSON.parse(cachedEvent) });
    }

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, email: true } }
      }
    });

    if (!event) {
      return res.status(404).json({ message: 'Evento não encontrado.' });
    }

    await redisClient.setEx(`${EVENT_CACHE_PREFIX}${id}`, 3600, JSON.stringify(event));
    res.status(200).json({ event });
  } catch (error) {
    console.error('Erro ao obter evento por ID:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao obter evento.' });
  }
};

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const eventData = updateEventSchema.parse(req.body);
    const { name, description, eventDate, location, onlineLink, maxCapacity } = eventData;

    if (req.role !== Role.ADMIN) {
      return res.status(403).json({ message: 'Acesso negado: Apenas administradores podem atualizar eventos.' });
    }

    const existingEvent = await prisma.event.findUnique({
      where: { id },
      select: { creatorId: true, maxCapacity: true, availableSpots: true, location: true, onlineLink: true }
    });

    if (!existingEvent) {
      return res.status(404).json({ message: 'Evento não encontrado para atualização.' });
    }

    const finalLocation = location !== undefined ? (location?.trim() || null) : existingEvent.location;
    const finalOnlineLink = onlineLink !== undefined ? (onlineLink?.trim() || null) : existingEvent.onlineLink;

    const hasFinalLocation = finalLocation !== null && finalLocation !== '';
    const hasFinalOnlineLink = finalOnlineLink !== null && finalOnlineLink !== '';

    if (!hasFinalLocation && !hasFinalOnlineLink) {
      return res.status(400).json({ message: 'O evento deve ter uma localização ou um link online.' });
    }
    if (hasFinalLocation && hasFinalOnlineLink) {
      return res.status(400).json({ message: 'O evento não pode ter localização e link online simultaneamente.' });
    }

    let newAvailableSpots: number | undefined = undefined;
    if (typeof maxCapacity === 'number' && typeof existingEvent.maxCapacity === 'number') {
      if (maxCapacity !== existingEvent.maxCapacity) {
        const delta = maxCapacity - existingEvent.maxCapacity;
        newAvailableSpots = Math.max(0, existingEvent.availableSpots + delta);
      } else {
        newAvailableSpots = existingEvent.availableSpots;
      }
    }

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
    if (description !== undefined) dataToUpdate.description = description ?? null;
    if (eventDate !== undefined) dataToUpdate.eventDate = new Date(eventDate as string);
    if (location !== undefined) dataToUpdate.location = finalLocation;
    if (onlineLink !== undefined) dataToUpdate.onlineLink = finalOnlineLink;
    if (typeof maxCapacity === 'number') {
      dataToUpdate.maxCapacity = maxCapacity;
      if (newAvailableSpots !== undefined) {
        dataToUpdate.availableSpots = newAvailableSpots;
      }
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: dataToUpdate,
    });

    await redisClient.del(`${EVENT_CACHE_PREFIX}${id}`);
    await redisClient.del(EVENT_LIST_CACHE_KEY);

    res.status(200).json({ message: 'Evento atualizado com sucesso!', event: updatedEvent });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Erro de validação.', errors: error.errors });
    }
    console.error('Erro ao atualizar evento:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao atualizar evento.' });
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (req.role !== Role.ADMIN) {
      return res.status(403).json({ message: 'Acesso negado: Apenas administradores podem deletar eventos.' });
    }

    const existingEvent = await prisma.event.findUnique({ where: { id } });
    if (!existingEvent) {
      return res.status(404).json({ message: 'Evento não encontrado para exclusão.' });
    }

    await prisma.event.delete({ where: { id } });
    await redisClient.del(`${EVENT_CACHE_PREFIX}${id}`);
    await redisClient.del(EVENT_LIST_CACHE_KEY);

    res.status(200).json({ message: 'Evento deletado com sucesso!' });
  } catch (error: any) {
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Não é possível deletar o evento devido a reservas associadas.' });
    }
    console.error('Erro ao deletar evento:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao deletar evento.' });
  }
};
