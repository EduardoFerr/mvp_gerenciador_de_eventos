// backend/src/routes/index.ts
// Este arquivo agrega todas as rotas da API e as exporta.

import { Router } from 'express';
import userRoutes from './userRoutes';
import eventRoutes from './eventRoutes';
import reservationRoutes from './reservationRoutes';

const router = Router();

// Prefixa as rotas de usuário com '/users'.
// Ex: /api/users/register, /api/users/login
router.use('/users', userRoutes);

// Prefixa as rotas de evento com '/events'.
// Ex: /api/events, /api/events/:id
router.use('/events', eventRoutes);

// Prefixa as rotas de reserva com '/reservations'.
// Note que algumas rotas de reserva também podem estar sob /events/...,
// mas esta base é para operações diretas em reservas ou minhas reservas.
// Ex: /api/reservations/:id, /api/my-reservations
router.use('/reservations', reservationRoutes);

export default router;
