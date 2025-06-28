import { Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { redisClient } from '../config/redis';

export async function healthCheck(req: Request, res: Response) {
    try {
        await prisma.$queryRaw`SELECT 1`;
        await redisClient.ping();
        res.status(200).json({ message: 'Serviços de backend e banco de dados estão saudáveis!' });
    } catch (error) {
        console.error('Erro na verificação de saúde:', error);
        res.status(500).json({ message: 'Erro na verificação de saúde dos serviços.' });
    }
}
