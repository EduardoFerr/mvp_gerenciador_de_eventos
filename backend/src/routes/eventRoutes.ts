// backend/src/routes/eventRoutes.ts
// Este arquivo define as rotas relacionadas ao gerenciamento de eventos.

import { Router } from 'express';
import {
  createEvent,
  listEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} from '../controllers/eventController';
import { authenticate, authorize } from '../middlewares/auth';
import { Role } from '@prisma/client'; // Importa o enum Role

const router = Router();

// Rota para criar um novo evento.
// Requer autenticação e apenas usuários com o papel 'ADMIN' podem acessar.
router.post('/', authenticate, authorize([Role.ADMIN]), createEvent);

// Rota para listar todos os eventos.
// Qualquer usuário autenticado (USER ou ADMIN) pode acessar.
// Não requer autenticação para listagem pública (seção 1.1 dos requisitos)
router.get('/', listEvents); // Rota pública, não precisa de autenticação para listar

// Rota para obter detalhes de um evento específico.
// Qualquer usuário autenticado (USER ou ADMIN) pode acessar.
// Não requer autenticação para detalhes públicos (seção 1.1 dos requisitos)
router.get('/:id', getEventById); // Rota pública, não precisa de autenticação para ver detalhes

// Rota para atualizar um evento existente.
// Requer autenticação e apenas usuários com o papel 'ADMIN' podem acessar.
router.put('/:id', authenticate, authorize([Role.ADMIN]), updateEvent);

// Rota para deletar um evento.
// Requer autenticação e apenas usuários com o papel 'ADMIN' podem acessar.
router.delete('/:id', authenticate, authorize([Role.ADMIN]), deleteEvent);

export default router;
