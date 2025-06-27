
import { createClient } from 'redis';
import dotenv from 'dotenv'; 

dotenv.config(); 
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient = createClient({
    url: redisUrl,
});

redisClient.on('error', (err) => console.error('Erro na conexão com o Redis:', err));
redisClient.on('connect', () => console.log('Redis conectado com sucesso!'));
