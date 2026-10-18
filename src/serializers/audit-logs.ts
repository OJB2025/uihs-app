import { z } from 'zod';

export const auditLogSerializer = z.object({
  id: z.string().uuid(),
  method: z.string(),
  route: z.string(),
  statusCode: z.number().int(),
  occurredAt: z.date(),
  actor: z.object({
    id: z.string().uuid(),
    username: z.string(),
    role: z.enum(['ADMIN', 'STAFF', 'GUARDIAN']),
  }),
});