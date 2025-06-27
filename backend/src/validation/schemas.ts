// backend/src/validation/schemas.ts
// Este arquivo define os schemas de validação para os dados de entrada da API usando Zod.

import { z } from 'zod';

// Helper function to check if a value is a non-empty string after trimming
const isNonEmptyString = (value: string | null | undefined): boolean => {
  return typeof value === 'string' && value.trim().length > 0;
};

// Schema para validação de registro de usuário
export const registerSchema = z.object({
  email: z.string().email('Formato de e-mail inválido.').min(1, 'E-mail é obrigatório.'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres.'),
});

// Schema para validação de login de usuário
export const loginSchema = z.object({
  email: z.string().email('Formato de e-mail inválido.').min(1, 'E-mail é obrigatório.'),
  password: z.string().min(1, 'A senha é obrigatória.'),
});

// Schema base para eventos (campos comuns)
const baseEventSchema = z.object({
  name: z.string().min(1, 'Nome do evento é obrigatório.'),
  description: z.string().nullable().optional(),
  eventDate: z.string().datetime('Formato de data e hora inválido para eventDate. Use ISO 8601 (ex: "2024-12-31T23:59").'),
  maxCapacity: z.number().int().positive('A capacidade máxima deve ser um número inteiro positivo.'),
});

// Schema para criação de evento
// Deve ter 'location' OU 'onlineLink', mas não ambos.
export const createEventSchema = baseEventSchema.extend({
  location: z.string().nullable().optional(),
  onlineLink: z.string().url('Formato de URL inválido para onlineLink.').nullable().optional(),
}).refine(data => {
  const hasLocation = isNonEmptyString(data.location);
  const hasOnlineLink = isNonEmptyString(data.onlineLink);

  if (hasLocation && hasOnlineLink) return false; // ambos presentes
  if (!hasLocation && !hasOnlineLink) return false; // nenhum presente
  return true; // um ou outro presente
}, {
  message: 'O evento deve ter uma localização OU um link online, mas não ambos.',
});

// Schema para atualização de evento: permite que todos os campos sejam opcionais.
export const updateEventSchema = z.object({
  name: z.string().min(1, 'Nome do evento é obrigatório.').optional(),
  description: z.string().nullable().optional(),
  eventDate: z.string().datetime('Formato de data e hora inválido para eventDate. Use ISO 8601 (ex: "2024-12-31T23:59").').optional(),
  maxCapacity: z.number().int().positive('A capacidade máxima deve ser um número inteiro positivo.').optional(),
  location: z.string().nullable().optional(),
  onlineLink: z.string().url('Formato de URL inválido para onlineLink.').nullable().optional(),
}).refine(data => {
  const isLocationInPayloadPresent = isNonEmptyString(data.location);
  const isOnlineLinkInPayloadPresent = isNonEmptyString(data.onlineLink);

  if (isLocationInPayloadPresent && isOnlineLinkInPayloadPresent) return false;
  return true;
}, {
  message: 'O evento não pode ter localização e link online simultaneamente no payload de atualização.',
});

// Schema para validação de criação de reserva
export const reservationSchema = z.object({
  eventId: z.string().uuid('ID do evento inválido.'),
});

// Schema para validação de atualização de status de reserva (admin)
export const updateReservationStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELED'], {
    errorMap: () => ({ message: 'Status de reserva inválido. Deve ser CONFIRMED ou CANCELED.' }),
  }),
});
