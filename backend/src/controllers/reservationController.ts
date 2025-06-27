// backend/src/controllers/reservationController.ts
// Este arquivo contém a lógica para o gerenciamento de reservas.

import { Request, Response } from 'express';
// Importa PrismaClient e os tipos da namespace Prisma para tipagem da transação
import { PrismaClient, ReservationStatus, Role, Prisma } from '@prisma/client'; 
import { reservationSchema, updateReservationStatusSchema } from '../validation/schemas';
import { ZodError } from 'zod';
import { prisma } from '../server'; // Importa a instância do Prisma do server.ts
import { redisClient } from '../config/redis'; // Importa o cliente Redis

const EVENT_CACHE_PREFIX = 'event:';
const EVENT_LIST_CACHE_KEY = 'events:list';

/**
 * Cria uma nova reserva para um evento. (Apenas Usuário)
 * Decrementa `availableSpots` do evento.
 */
export const createReservation = async (req: Request, res: Response) => {
  try {
    const { id: eventId } = req.params; // ID do evento da URL
    const userId = req.userId!; // ID do usuário autenticado

    // 1. Valida o eventId com o schema Zod.
    reservationSchema.parse({ eventId });

    // 2. Garante que a requisição está sendo feita por um Usuário.
    if (req.role !== Role.USER) {
      return res.status(403).json({ message: 'Acesso negado: Apenas usuários podem fazer reservas.' });
    }

    // 3. Inicia uma transação para garantir atomicidade.
    // @ts-ignore: A tipagem de `tx` em `$transaction` pode ser problemática com certas versões do TS/Prisma.
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 3.1. Busca o evento e bloqueia-o para evitar condições de corrida.
      const event = await tx.event.findUnique({
        where: { id: eventId },
        select: { id: true, availableSpots: true, maxCapacity: true, eventDate: true },
      });

      if (!event) {
        throw new Error('Evento não encontrado.');
      }

      // Verifica se o evento já passou
      if (event.eventDate < new Date()) {
        throw new Error('Não é possível reservar vagas para um evento que já ocorreu.');
      }

      // 3.2. Verifica se há vagas disponíveis.
      if (event.availableSpots <= 0) {
        throw new Error('Desculpe, não há mais vagas disponíveis para este evento.');
      }

      // 3.3. Verifica se o usuário já tem uma reserva CONFIRMED para este evento.
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

      // 3.4. Decrementa as vagas disponíveis do evento.
      await tx.event.update({
        where: { id: eventId },
        data: {
          availableSpots: {
            decrement: 1, // Decrementa 1 vaga.
          },
        },
      });

      // 3.5. Cria a nova reserva.
      const newReservation = await tx.reservation.create({
        data: {
          eventId: eventId,
          userId: userId,
          status: ReservationStatus.CONFIRMED,
        },
      });

      return newReservation;
    });

    // 4. Invalida o cache do evento e da lista de eventos.
    // O 'result' aqui é a reserva criada, e não um array.
    await redisClient.del(`${EVENT_CACHE_PREFIX}${result.eventId}`);
    await redisClient.del(EVENT_LIST_CACHE_KEY);

    // 5. Envia a resposta de sucesso.
    res.status(201).json({ message: 'Reserva criada com sucesso!', reservation: result });
  } catch (error) {
    // Lida com erros de validação Zod.
    if (error instanceof ZodError) {
      return res.status(400).json({ message: 'Erro de validação.', errors: error.errors });
    }
    // Lida com erros de transação ou outros erros.
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
    const { id: reservationId } = req.params; // ID da reserva a ser cancelada
    const requestingUserId = req.userId!;     // ID do usuário que fez a requisição
    const requestingUserRole = req.role!;     // Papel do usuário que fez a requisição

    // 1. Inicia uma transação.
    // @ts-ignore: A tipagem de `tx` em `$transaction` pode ser problemática com certas versões do TS/Prisma.
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1.1. Busca a reserva existente.
      const existingReservation = await tx.reservation.findUnique({
        where: { id: reservationId },
        select: { id: true, eventId: true, userId: true, status: true },
      });

      if (!existingReservation) {
        throw new Error('Reserva não encontrada.');
      }

      // 1.2. Verifica a autorização:
      // - Se o usuário é ADMIN, pode cancelar qualquer reserva.
      // - Se o usuário é USER, só pode cancelar suas próprias reservas.
      if (requestingUserRole === Role.USER && existingReservation.userId !== requestingUserId) {
        throw new Error('Acesso negado: Você não tem permissão para cancelar esta reserva.');
      }

      // 1.3. Verifica se a reserva já está cancelada.
      if (existingReservation.status === ReservationStatus.CANCELED) {
        throw new Error('Esta reserva já está cancelada.');
      }

      // 1.4. Atualiza o status da reserva para CANCELED.
      const updatedReservation = await tx.reservation.update({
        where: { id: reservationId },
        data: { status: ReservationStatus.CANCELED },
      });

      // 1.5. Incrementa as vagas disponíveis do evento associado.
      await tx.event.update({
        where: { id: existingReservation.eventId },
        data: {
          availableSpots: {
            increment: 1, // Incrementa 1 vaga.
          },
        },
      });

      return updatedReservation;
    });

    // 2. Invalida o cache do evento e da lista de eventos.
    // O 'result' aqui é a reserva cancelada, e não um array.
    await redisClient.del(`${EVENT_CACHE_PREFIX}${result.eventId}`);
    await redisClient.del(EVENT_LIST_CACHE_KEY);

    // 3. Envia a resposta de sucesso.
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
    const userId = req.userId!; // ID do usuário autenticado

    // 1. Garante que a requisição está sendo feita por um Usuário.
    if (req.role !== Role.USER) {
      return res.status(403).json({ message: 'Acesso negado: Apenas usuários podem ver suas próprias reservas.' });
    }

    // 2. Busca todas as reservas do usuário.
    const reservations = await prisma.reservation.findMany({
      where: { userId: userId },
      include: {
        event: { // Inclui os detalhes do evento associado
          select: { id: true, name: true, eventDate: true, location: true, onlineLink: true, maxCapacity: true, availableSpots: true },
        },
      },
      orderBy: {
        reservationDate: 'desc', // Ordena pelas mais recentes
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
    const { id: eventId } = req.params; // ID do evento da URL

    // 1. Garante que a requisição está sendo feita por um Admin.
    if (req.role !== Role.ADMIN) {
      return res.status(403).json({ message: 'Acesso negado: Apenas administradores podem ver as reservas de um evento.' });
    }

    // 2. Verifica se o evento existe.
    const eventExists = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true }
    });
    if (!eventExists) {
      return res.status(404).json({ message: 'Evento não encontrado.' });
    }

    // 3. Busca todas as reservas para o evento especificado.
    const reservations = await prisma.reservation.findMany({
      where: { eventId: eventId },
      include: {
        user: { // Inclui informações básicas do usuário que fez a reserva
          select: { id: true, email: true },
        },
      },
      orderBy: {
        reservationDate: 'asc', // Ordena pelas mais antigas
      },
    });

    res.status(200).json({ reservations });
  } catch (error) {
    console.error('Erro ao listar reservas do evento:', error);
    res.status(500).json({ message: 'Erro interno do servidor ao listar reservas do evento.' });
  }
};