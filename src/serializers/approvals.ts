import { z } from 'zod';

export const approvalRequestSerializer = z.object({
  id: z.string().uuid(),
  username: z.string(),
  email: z.string().email().nullable(),
  createdAt: z.date(),
  guardianProfile: z.object({
    firstName: z.string(),
    lastName: z.string(),
  }).nullable(),
});

export const approvalResultSerializer = z.object({
  id: z.string().uuid(),
  approvalStatus: z.enum(['APPROVED', 'REJECTED']),
});