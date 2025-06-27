// backend/src/middlewares/auth.ts
// Este arquivo contém middlewares para autenticação (JWT) e autorização (baseada em papel).

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../config/jwt';
import { prisma } from '../server'; // Importa a instância do Prisma
import { Role } from '@prisma/client'; // Importa o enum Role do Prisma

/**
 * Middleware de autenticação:
 * Verifica a presença e validade de um token JWT no cabeçalho 'Authorization'.
 * Se o token for válido, decodifica o payload e anexa o 'userId' e 'role' ao objeto 'req'.
 * Se o token for inválido ou ausente, retorna um erro 401 (Não Autorizado).
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  // Obtém o cabeçalho de autorização.
  const authHeader = req.headers.authorization;

  // Verifica se o cabeçalho de autorização está presente e no formato correto.
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Não autorizado: Token não fornecido ou formato inválido.' });
  }

  // Extrai o token JWT (remove "Bearer ").
  const token = authHeader.split(' ')[1];

  try {
    // Verifica o token usando a função utilitária.
    const decoded = verifyToken(token); // O payload decodificado (ex: { id: '...', role: '...' })

    // Busca o usuário no banco de dados para garantir que ele ainda existe e tem o papel correto.
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true } // Seleciona apenas o ID e o papel.
    });

    if (!user) {
      return res.status(401).json({ message: 'Não autorizado: Usuário não encontrado.' });
    }

    // Anexa o ID do usuário e o papel ao objeto 'req' para uso posterior nas rotas.
    req.userId = user.id;
    req.role = user.role;

    next(); // Continua para o próximo middleware ou rota.
  } catch (error: any) {
    // Lida com erros de verificação do token (ex: token expirado, inválido).
    return res.status(401).json({ message: `Não autorizado: ${error.message}` });
  }
};

/**
 * Middleware de autorização:
 * Retorna um middleware que verifica se o usuário autenticado tem um dos papéis permitidos.
 * @param roles Um array de papéis permitidos (ex: [Role.ADMIN, Role.USER]).
 * @returns Um middleware de Express.
 */
export const authorize = (roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Verifica se o 'role' foi anexado ao objeto 'req' pelo middleware de autenticação.
    if (!req.role) {
      // Isso deve ser impossível se o middleware 'authenticate' for usado primeiro.
      return res.status(403).json({ message: 'Acesso negado: Papel do usuário não definido.' });
    }

    // Verifica se o papel do usuário está incluído na lista de papéis permitidos.
    if (!roles.includes(req.role)) {
      return res.status(403).json({ message: 'Acesso negado: Você não tem permissão para realizar esta ação.' });
    }

    next(); // Continua para o próximo middleware ou rota.
  };
};

