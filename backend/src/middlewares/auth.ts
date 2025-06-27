import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../config/jwt';
import { prisma } from '../server'; 
import { Role } from '@prisma/client';

/**
 * Middleware de autenticação:
 * Verifica a presença e validade de um token JWT no cabeçalho 'Authorization'.
 * Se o token for válido, decodifica o payload e anexa o 'userId' e 'role' ao objeto 'req'.
 * Se o token for inválido ou ausente, retorna um erro 401 (Não Autorizado).
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Não autorizado: Token não fornecido ou formato inválido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token); // O payload decodificado (ex: { id: '...', role: '...' })

    // Busca o usuário no banco de dados para garantir que ele ainda existe e tem o papel correto.
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true }
    });

    if (!user) {
      return res.status(401).json({ message: 'Não autorizado: Usuário não encontrado.' });
    }

    // Anexa o ID do usuário e o papel ao objeto 'req' para uso posterior nas rotas.
    req.userId = user.id;
    req.role = user.role;

    next(); 
  } catch (error: any) {
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
    if (!req.role) {
      return res.status(403).json({ message: 'Acesso negado: Papel do usuário não definido.' });
    }

    if (!roles.includes(req.role)) {
      return res.status(403).json({ message: 'Acesso negado: Você não tem permissão para realizar esta ação.' });
    }

    next();
  };
};

