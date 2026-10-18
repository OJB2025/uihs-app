import { z } from 'zod';

export const createConversationSchema = z.object({
  staffUserId: z.string().uuid(),
});

export const createMessageSchema = z.object({
  body: z.string().trim().min(1).max(5000),
});

export const conversationParamsSchema = z.object({
  id: z.string().uuid(),
});