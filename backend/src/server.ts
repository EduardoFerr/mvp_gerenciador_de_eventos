import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { prisma } from './services/prisma';
import { redisClient } from './config/redis';
import apiRoutes from './routes';
import { errorHandler } from './middlewares/errorHandler';

dotenv.config();

const port = process.env.PORT;
const origin = process.env.FRONTEND_URL;

if (!port) {
  console.error('PORT não definida no .env');
  process.exit(1);
}

const app = express();

// Middlewares
app.use(cors({ origin, credentials: true }));
app.use(express.json());

// Rotas
app.use('/api', apiRoutes);

// Tratamento global de erros
app.use(errorHandler);

// Inicialização
async function startServer() {
  try {
    console.log('Conectando ao Redis...');
    await redisClient.connect();
    console.log('Redis conectado!');

    app.listen(port, () => {
      console.log(`Servidor rodando na porta ${port}`);
    });
  } catch (err) {
    console.error('Erro crítico ao iniciar o servidor:', err);
    await gracefulShutdown();
    process.exit(1);
  }
}

// Encerramento seguro
async function gracefulShutdown() {
  console.log('Encerrando serviços...');
  await prisma.$disconnect();
  await redisClient.quit();
  console.log('Serviços encerrados.');
}

// Tratamento de falhas críticas
process.on('uncaughtException', async (err) => {
  console.error('Exceção não capturada:', err);
  await gracefulShutdown();
  process.exit(1);
});

process.on('unhandledRejection', async (reason) => {
  console.error('Rejeição de Promise não tratada:', reason);
  await gracefulShutdown();
  process.exit(1);
});

process.on('beforeExit', gracefulShutdown);

startServer();
