import { Request, Response } from 'express';
import { PrismaClient, ReservationStatus, Role, Prisma } from '@prisma/client'; 
import { reservationSchema, updateReservationStatusSchema } from '../validation/schemas';
import { ZodError } from 'zod';
import { prisma } from '../services/prisma';
import { redisClient } from '../config/redis'; 

const EVENT_CACHE_PREFIX = 'event:';
const EVENT_LIST_CACHE_KEY = 'events:list';

/**
 * Cria uma nova reserva para um evento.
 * Requer autenticação de usuário `USER`.
 */
export const createReservation = async (req: Request, res: Response) => {
  try {
    const { id: eventId } = req.params; 
    const userId = req.userId!; 

    reservationSchema.parse({ eventId });

    if (req.role !== Role.USER) {
      return res.status(403).json({ message: 'Acesso negado: Apenas usuários podem fazer reservas.' });
    }

    // @ts-ignore: Tipagem de `tx` em `$transaction` pode ser problemática.
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const event = await tx.event.findUnique({
        where: { id: eventId },
        select: { id: true, availableSpots: true, maxCapacity: true, eventDate: true },
      });

      if (!event) {
        throw new Error('Evento não encontrado.');
      }

      if (event.eventDate < new Date()) {
        throw new Error('Não é possível reservar vagas para um evento que já ocorreu.');
      }

      if (event.availableSpots <= 0) {
        throw new Error('Desculpe, não há mais vagas disponíveis para este evento.');
      }

      const existingReservation = await tx.reservation.findFirst({
        where: {
          eventId: eventId,
          userId: userId,
          status: ReservationStatus.CONFIRMED,
        },
      });

      if (existingReservation) {
        throw new Error('Você já possui uma reserva confirmada para este evento.');
      }

      await tx.event.update({
        where: { id: eventId },
        data: {
          availableSpots: {
            decrement: 1, 
          },
        },
      });

      const newReservation = await tx.reservation.create({
        data: {
          eventId: eventId,
          userId: userId,
          status: ReservationStatus.CONFIRMED,
        },
      });

      return newReservation;
    });

    await redisClient.del(`${EVENT_CACHE_PREFIX}${result.eventId}`);
    await redisClient.del(EVENT_LIST_CACHE_KEY);

    res.status(201).json({ message: 'Reserva criada com sucesso!', reservation: result });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Erro de validação.', errors: error.errors });
    }
    console.error('Erro ao criar reserva:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Erro interno do servidor ao criar reserva.' });
  }
};

/**
 * Cancela uma reserva. (Usuário pode cancelar suas próprias reservas, Admin pode cancelar qualquer reserva)
 * Incrementa `availableSpots` do evento.
 */
export const cancelReservation = async (req: Request, res: Response) => {
  try {
    const { id: reservationId } = req.params; 
    const requestingUserId = req.userId!;     
    const requestingUserRole = req.role!;     

    // @ts-ignore: Tipagem de `tx` em `$transaction` pode ser problemática.
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const existingReservation = await tx.reservation.findUnique({
        where: { id: reservationId },
        select: { id: true, eventId: true, userId: true, status: true },
      });

      if (!existingReservation) {
        throw new Error('Reserva não encontrada.');
      }

      if (requestingUserRole === Role.USER && existingReservation.userId !== requestingUserId) {
        throw new Error('Acesso negado: Você não tem permissão para cancelar esta reserva.');
      }

      if (existingReservation.status === ReservationStatus.CANCELED) {
        throw new Error('Esta reserva já está cancelada.');
      }

      const updatedReservation = await tx.reservation.update({
        where: { id: reservationId },
        data: { status: ReservationStatus.CANCELED },
      });

      await tx.event.update({
        where: { id: existingReservation.eventId },
        data: {
          availableSpots: {
            increment: 1, 
          },
        },
      });

      return updatedReservation;
    });

    await redisClient.del(`${EVENT_CACHE_PREFIX}${result.eventId}`);
    await redisClient.del(EVENT_LIST_CACHE_KEY);

    res.status(200).json({ message: 'Reserva cancelada com sucesso!', reservation: result });
  } catch (error) {
    console.error('Erro ao cancelar reserva:', error);
    res.status(500).json({ message: error instanceof Error ? error.message : 'Erro interno do servidor ao cancelar reserva.' });
  }
};

/**
 * Lista todas as reservas para o usuário autenticado. (Apenas Usuário)
 */
export const getMyReservations = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!; 

    if (req.role !== Role.USER) {
      return res.status(403).json({ message: 'Acesso negado: Apenas usuários podem ver suas próprias reservas.' });
    }

    const reservations = await prisma.reservation.findMany({
      where: { userId: userId },
      include: {
        event: { 
          select: { id: true, name: true, eventDate: true, location: true, onlineLink: true, maxCapacity: true, availableSpots: true },
        },
        user: { // <--- CORREÇÃO AQUI: Incluir o objeto user para que o frontend possa acessar .email
            select: { id: true, email: true },
        }
      },
      orderBy: {
        reservationDate: 'desc', 
      },
    });

    res.status(200).json({ reservations });
  } catch (error) {
    console.error('Erro ao listar minhas reservas:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao listar suas reservas.' });
  }
};

/**
 * Lista todas as reservas para um evento específico. (Apenas Admin)
 */
export const getEventReservations = async (req: Request, res: Response) => {
  try {
    const { id: eventId } = req.params; 

    if (req.role !== Role.ADMIN) {
      return res.status(403).json({ message: 'Acesso negado: Apenas administradores podem ver as reservas de um evento.' });
    }

    const eventExists = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true }
    });
    if (!eventExists) {
      return res.status(404).json({ message: 'Evento não encontrado.' });
    }

    const reservations = await prisma.reservation.findMany({
      where: { eventId: eventId },
      include: {
        user: { 
          select: { id: true, email: true },
        },
      },
      orderBy: {
        reservationDate: 'asc', 
      },
    });

    res.status(200).json({ reservations });
  } catch (error) {
    console.error('Erro ao listar reservas do evento:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao listar reservas do evento.' });
  }
};
