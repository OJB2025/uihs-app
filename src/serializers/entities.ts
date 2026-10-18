import { z } from 'zod';

export const publicUserSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  email: z.string().email().nullable(),
  role: z.enum(['ADMIN', 'STAFF', 'GUARDIAN']),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const staffSerializer = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  employeeNumber: z.string().nullable(),
  firstName: z.string(),
  lastName: z.string(),
  jobTitle: z.string().nullable(),
  user: publicUserSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const guardianSerializer = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  user: publicUserSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const childSerializer = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const childGuardianSerializer = z.object({
  childId: z.string().uuid(),
  guardianId: z.string().uuid(),
  relationship: z.string(),
  isPrimaryContact: z.boolean(),
  canPickup: z.boolean(),
  createdAt: z.date(),
});

export const staffAssignmentSerializer = z.object({
  id: z.string().uuid(),
  staffProfileId: z.string().uuid(),
  childId: z.string().uuid(),
  startsAt: z.date(),
  endsAt: z.date().nullable(),
});

export const activitySerializer = z.object({
  id: z.string().uuid(),
  childId: z.string().uuid(),
  createdById: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  activityAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const activityPlanSerializer = z.object({
  id: z.string().uuid(),
  childId: z.string().uuid(),
  createdById: z.string().uuid(),
  period: z.enum(['WEEK', 'MONTH']),
  periodStart: z.date(),
  title: z.string(),
  description: z.string().nullable(),
  plannedFor: z.date().nullable(),
  status: z.enum(['PLANNED', 'COMPLETED', 'CANCELLED']),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const goalSerializer = z.object({
  id: z.string().uuid(),
  childId: z.string().uuid(),
  createdById: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'ACHIEVED', 'ON_HOLD']),
  targetDate: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const performanceRatingSerializer = z.object({
  id: z.string().uuid(),
  childId: z.string().uuid(),
  createdById: z.string().uuid(),
  category: z.string(),
  score: z.number().int().min(1).max(5),
  notes: z.string().nullable(),
  ratedAt: z.date(),
  createdAt: z.date(),
});

export const mediaAssetSerializer = z.object({
  id: z.string().uuid(),
  childId: z.string().uuid(),
  activityId: z.string().uuid().nullable(),
  kind: z.enum(['IMAGE', 'VIDEO']),
  originalName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int(),
  createdAt: z.date(),
});