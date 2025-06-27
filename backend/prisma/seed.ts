import { PrismaClient, Role, ReservationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o seeding do banco de dados...');

  // Apaga dados na ordem correta, ignorando erro se a tabela não existir
  try {
    await prisma.reservation.deleteMany();
    console.log('Reservas apagadas.');
  } catch (e) {
    console.warn('Tabela Reservation não existe ainda, pulando delete.');
  }
  try {
    await prisma.event.deleteMany();
    console.log('Eventos apagados.');
  } catch (e) {
    console.warn('Tabela Event não existe ainda, pulando delete.');
  }
  try {
    await prisma.user.deleteMany();
    console.log('Usuários apagados.');
  } catch (e) {
    console.warn('Tabela User não existe ainda, pulando delete.');
  }

  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@admin.com',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });
  console.log(`Usuário Admin criado: ${adminUser.email} com ID: ${adminUser.id}`);

  const regularUser = await prisma.user.create({
    data: {
      email: 'user@teste.com',
      password: hashedPassword,
      role: Role.USER,
    },
  });
  console.log(`Usuário Regular criado: ${regularUser.email} com ID: ${regularUser.id}`);

  const event1 = await prisma.event.create({
    data: {
      name: 'Workshop de React Avançado',
      description: 'Aprenda os conceitos avançados do React, hooks customizados e gerenciamento de estado.',
      eventDate: new Date(new Date().setHours(10, 0, 0, 0) + 7 * 24 * 60 * 60 * 1000),
      location: 'Auditório Principal, Centro de Convenções',
      maxCapacity: 100,
      availableSpots: 100,
      creatorId: adminUser.id,
    },
  });
  console.log(`Evento 1 criado: ${event1.name}`);

  const event2 = await prisma.event.create({
    data: {
      name: 'Webinar sobre Search Engine Optimization com IA',
      description: 'Explorando as últimas tendências e aplicações de IA no mundo real com foco em SEO.',
      eventDate: new Date(new Date().setHours(14, 0, 0, 0) + 14 * 24 * 60 * 60 * 1000),
      onlineLink: 'https://meet.google.com/ai-seo-webinar',
      maxCapacity: 500,
      availableSpots: 500,
      creatorId: adminUser.id,
    },
  });
  console.log(`Evento 2 criado: ${event2.name}`);

  await prisma.reservation.create({
    data: {
      eventId: event1.id,
      userId: regularUser.id,
      status: ReservationStatus.CONFIRMED,
    },
  });
  console.log(`Reserva 1 criada para o Evento 1 pelo ${regularUser.email}`);

  await prisma.reservation.create({
    data: {
      eventId: event2.id,
      userId: regularUser.id,
      status: ReservationStatus.CONFIRMED,
    },
  });
  console.log(`Reserva 2 criada para o Evento 2 pelo ${regularUser.email}`);

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
