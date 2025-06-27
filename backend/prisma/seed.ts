import { PrismaClient, Role, ReservationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o seeding do banco de dados...');

  // Limpa dados
  await prisma.reservation.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Cria admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@admin.com',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });
  console.log(`Admin criado: ${adminUser.email}`);

  // Cria usuários comuns
  const userPromises = Array.from({ length: 5 }).map((_, i) =>
    prisma.user.create({
      data: {
        email: `user${i + 1}@teste.com`,
        password: hashedPassword,
        role: Role.USER,
      },
    })
  );
  const users = await Promise.all(userPromises);
  console.log(`Usuários criados: ${users.map(u => u.email).join(', ')}`);

  // Cria eventos
  const events = await Promise.all([
    prisma.event.create({
      data: {
        name: 'Workshop de React Avançado',
        description: 'Hooks customizados e gerenciamento de estado.',
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        location: 'Auditório Principal, Centro de Convenções',
        maxCapacity: 100,
        availableSpots: 100,
        creatorId: adminUser.id,
      },
    }),
    prisma.event.create({
      data: {
        name: 'Webinar sobre SEO com IA',
        description: 'IA aplicada em otimização para motores de busca.',
        eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        onlineLink: 'https://meet.google.com/seo-ai',
        maxCapacity: 500,
        availableSpots: 500,
        creatorId: adminUser.id,
      },
    }),
    prisma.event.create({
      data: {
        name: 'Oficina de UX Design',
        description: 'Melhores práticas de UX para apps modernos.',
        eventDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        location: 'Sala 204, Bloco B',
        maxCapacity: 80,
        availableSpots: 80,
        creatorId: adminUser.id,
      },
    }),
    prisma.event.create({
      data: {
        name: 'Bootcamp Fullstack com TypeScript',
        description: 'Backend, frontend e DevOps com TS moderno.',
        eventDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        location: 'Campus Virtual - Plataforma própria',
        maxCapacity: 300,
        availableSpots: 300,
        creatorId: adminUser.id,
      },
    }),
  ]);
  console.log(`Eventos criados: ${events.map(e => e.name).join(', ')}`);

  // Cria reservas para os usuários
  await Promise.all(users.map((user, i) =>
    prisma.reservation.create({
      data: {
        userId: user.id,
        eventId: events[i % events.length].id,
        status: ReservationStatus.CONFIRMED,
      },
    })
  ));
  console.log('Reservas criadas para usuários.');

  console.log('Seeding concluído.');
}

main()
  .catch((e) => {
    console.error('Erro durante o seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
