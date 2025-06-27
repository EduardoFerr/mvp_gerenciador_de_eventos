// backend/src/server.ts
// Ponto de entrada da aplicação backend (servidor Express).

import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { redisClient } from './config/redis';
import apiRoutes from './routes'; // Importa o index de rotas

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Inicializa o cliente Prisma
export const prisma = new PrismaClient();

// Middlewares
// Habilita o CORS para permitir requisições de diferentes origens (frontend).
app.use(cors());
// Habilita o parsing de JSON para requisições com corpo JSON.
app.use(express.json());

// Middleware para testar a conexão com o banco de dados e Redis
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Testa a conexão com o PostgreSQL
    await prisma.$queryRaw`SELECT 1`;
    // Testa a conexão com o Redis
    await redisClient.ping();
    res.status(200).json({ message: 'Serviços de backend e banco de dados estão saudáveis!' });
  } catch (error) {
    console.error('Erro na verificação de saúde:', error);
    res.status(500).json({ message: 'Erro na verificação de saúde dos serviços.' });
  }
});

// Rotas da API
// Todas as rotas definidas em './routes/index.ts' serão prefixadas com '/api'.
app.use('/api', apiRoutes);

// Middleware de tratamento de erros global
// Este middleware captura e processa erros que ocorrem nas rotas e outros middlewares.
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Erro detectado no middleware de erros:', err.stack); // Loga o stack trace do erro.
  if (err.name === 'UnauthorizedError') {
    // Erro de autenticação JWT
    return res.status(401).json({ message: 'Não autorizado: Token inválido ou ausente.' });
  }
  // Para outros tipos de erros, envia uma resposta de erro genérica.
  res.status(500).json({ message: 'Ocorreu um erro interno no servidor.', error: err.message });
});

// CAPTURA GLOBAL DE EXCEÇÕES E REJEIÇÕES DE PROMISE
// Isso é crucial para depurar crashes que não são capturados por middlewares específicos.
process.on('uncaughtException', (err: Error) => {
  console.error('ERRO FATAL: Exceção não capturada! O servidor será encerrado.');
  console.error(err.stack);
  // É uma boa prática encerrar o processo após uma exceção não capturada,
  // pois o aplicativo pode estar em um estado inconsistente.
  process.exit(1); 
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('ERRO: Rejeição de Promise não tratada! O servidor será encerrado.');
  console.error('Motivo:', reason);
  promise.catch(err => console.error('Erro da Promise:', err.stack)); // Loga o stack trace se houver.
  // Encerrar o processo para rejeições não tratadas também é recomendado.
  process.exit(1);
});


// Inicia o servidor Express
app.listen(port, async () => {
  console.log(`Servidor backend rodando na porta ${port}`);
  console.log('Conectando ao Redis...');
  try {
    await redisClient.connect(); // Conecta ao Redis
    console.log('Conectado ao Redis!');
  } catch (error) {
    console.error('Erro ao conectar ao Redis:', error);
  }

  // Conecta ao banco de dados Prisma (automaticamente gerado pelo cliente)
  // O Prisma faz lazy connection, então esta linha apenas indica que o cliente está pronto.
  // A conexão real acontece na primeira requisição ao banco.
  console.log('Prisma pronto para conectar ao banco de dados...');
});

// Desconecta o Prisma e o Redis antes de o processo ser encerrado
process.on('beforeExit', async () => {
  console.log('Desconectando Prisma...');
  await prisma.$disconnect();
  console.log('Prisma desconectado.');

  console.log('Desconectando Redis...');
  await redisClient.quit();
  console.log('Redis desconectado.');
});

