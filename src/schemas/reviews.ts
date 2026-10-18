import { z } from 'zod';

export const reviewCreateSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().trim().min(1).max(5000),
});

export const reviewParamsSchema = z.object({
  childId: z.string().uuid(),
});

export const reviewResponseParamsSchema = z.object({
  childId: z.string().uuid(),
  reviewId: z.string().uuid(),
});

export const reviewResponseSchema = z.object({
  staffResponse: z.string().trim().min(1).max(5000),
});

export const notificationParamsSchema = z.object({
  id: z.string().uuid(),
});