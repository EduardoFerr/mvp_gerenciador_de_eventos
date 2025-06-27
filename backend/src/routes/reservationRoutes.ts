// backend/src/routes/reservationRoutes.ts
// Este arquivo define as rotas relacionadas ao gerenciamento de reservas.

import { Router } from 'express';
import {
  createReservation,
  cancelReservation,
  getMyReservations,
  getEventReservations,
} from '../controllers/reservationController';
import { authenticate, authorize } from '../middlewares/auth';
import { Role } from '@prisma/client'; // Importa o enum Role

const router = Router();

// Rota para criar uma nova reserva para um evento específico.
// URL: /api/events/:id/reserve (o ID aqui é o eventId)
// Requer autenticação e apenas usuários com o papel 'USER' podem acessar.
router.post('/events/:id/reserve', authenticate, authorize([Role.USER]), createReservation);

// Rota para cancelar uma reserva específica.
// URL: /api/reservations/:id (o ID aqui é o reservationId)
// Requer autenticação. Usuários podem cancelar suas próprias reservas. Admins podem cancelar qualquer reserva.
router.delete('/:id', authenticate, cancelReservation);

// Rota para listar todas as reservas do usuário autenticado.
// URL: /api/my-reservations
// Requer autenticação e apenas usuários com o papel 'USER' podem acessar.
router.get('/my-reservations', authenticate, authorize([Role.USER]), getMyReservations);

// Rota para listar todas as reservas de um evento específico.
// URL: /api/events/:id/reservations (o ID aqui é o eventId)
// Requer autenticação e apenas usuários com o papel 'ADMIN' podem acessar.
router.get('/events/:id/reservations', authenticate, authorize([Role.ADMIN]), getEventReservations);

export default router;
