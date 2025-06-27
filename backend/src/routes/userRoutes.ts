// backend/src/routes/userRoutes.ts
// Este arquivo define as rotas relacionadas ao gerenciamento de usuários.

import { Router } from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  deleteUser,
  listUsers,
} from '../controllers/userController';
import { authenticate, authorize } from '../middlewares/auth';
import { Role } from '@prisma/client'; // Importa o enum Role

const router = Router();

// Rota pública para registro de novo usuário.
// Qualquer um pode acessar.
router.post('/register', registerUser);

// Rota pública para login de usuário.
// Qualquer um pode acessar.
router.post('/login', loginUser);

// Rota para obter o perfil do usuário logado.
// Requer autenticação (qualquer ROLE pode acessar seu próprio perfil).
// Se um ID for fornecido nos parâmetros (ex: /api/users/:id),
// apenas ADMINs podem ver perfis de outros usuários.
router.get('/me', authenticate, getUserProfile); // CORREÇÃO: Rota específica para o próprio perfil
router.get('/:id', authenticate, authorize([Role.ADMIN]), getUserProfile); // Rota para ADMIN ver outros perfis

// Rota para atualizar o perfil de um usuário.
// Usuário comum: pode atualizar seu próprio perfil.
// Admin: pode atualizar qualquer perfil, incluindo o papel.
router.put('/:id', authenticate, updateUserProfile);

// Rota para deletar um usuário.
// Requer autenticação e apenas usuários com o papel 'ADMIN' podem acessar.
router.delete('/:id', authenticate, authorize([Role.ADMIN]), deleteUser);

// Rota para listar todos os usuários.
// Requer autenticação e apenas usuários com o papel 'ADMIN' podem acessar.
router.get('/', authenticate, authorize([Role.ADMIN]), listUsers);

export default router;
