import { Router } from 'express';
import userRoutes from './userRoutes';
import eventRoutes from './eventRoutes';
import reservationRoutes from './reservationRoutes';
import { healthCheck } from '../controllers/healthController';

const router = Router();


router.get('/health', healthCheck);

router.use('/users', userRoutes);


router.use('/events', eventRoutes);

/* Prefixa as rotas de reserva com '/reservations'.
Nota!  algumas rotas de reservaestão sob /events/...,
mas esta base é para operações diretas em reservas ou minhas reservas.
Ex: /api/reservations/:id, /api/my-reservations */
router.use('/reservations', reservationRoutes);

export default router;
