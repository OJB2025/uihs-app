import { z } from 'zod';

const userSummary = z.object({
  id: z.string().uuid(),
  username: z.string(),
});

export const reviewSerializer = z.object({
  id: z.string().uuid(),
  childId: z.string().uuid(),
  authorId: z.string().uuid(),
  rating: z.number().int().min(1).max(5).nullable(),
  comment: z.string(),
  staffResponse: z.string().nullable(),
  staffRespondedById: z.string().uuid().nullable(),
  staffRespondedAt: z.date().nullable(),
  createdAt: z.date(),
  author: userSummary,
  staffRespondedBy: userSummary.nullable(),
});

export const notificationSerializer = z.object({
  id: z.string().uuid(),
  reviewId: z.string().uuid(),
  readAt: z.date().nullable(),
  createdAt: z.date(),
  review: z.object({
    id: z.string().uuid(),
    childId: z.string().uuid(),
    rating: z.number().int().min(1).max(5).nullable(),
    comment: z.string(),
    createdAt: z.date(),
    child: z.object({ firstName: z.string(), lastName: z.string() }),
  }),
});