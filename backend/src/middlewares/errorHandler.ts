import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error('Erro detectado no middleware de erros:', err.stack);
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'Não autorizado: Token inválido ou ausente.' });
  }
  res.status(500).json({ message: 'Erro interno no servidor.', error: err.message });
}
