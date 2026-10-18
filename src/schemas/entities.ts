import { z } from 'zod';

const username = z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9._-]+$/).transform((value) => value.toLowerCase());
const email = z.string().email().max(254).optional();
const password = z.string().min(12).max(128);
const name = z.string().trim().min(1).max(100);

export const loginSchema = z.object({ username, password });
export const guardianRegistrationSchema = z.object({ username, email, password, firstName: name, lastName: name });

export const staffCreateSchema = z.object({
  username,
  email,
  password,
  employeeNumber: z.string().trim().min(1).max(50).optional(),
  firstName: name,
  lastName: name,
  jobTitle: z.string().trim().max(100).optional(),
});
export const staffUpdateSchema = z.object({
  employeeNumber: z.string().trim().min(1).max(50).nullable().optional(),
  firstName: name.optional(),
  lastName: name.optional(),
  jobTitle: z.string().trim().max(100).nullable().optional(),
}).refine((value) => Object.keys(value).length > 0);

export const guardianCreateSchema = guardianRegistrationSchema;
export const guardianUpdateSchema = z.object({
  firstName: name.optional(),
  lastName: name.optional(),
}).refine((value) => Object.keys(value).length > 0);

export const childCreateSchema = z.object({ firstName: name, lastName: name });
export const childUpdateSchema = z.object({
  firstName: name.optional(),
  lastName: name.optional(),
  isActive: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0);

export const idParamsSchema = z.object({ id: z.string().uuid() });
export const childGuardianParamsSchema = z.object({
  childId: z.string().uuid(),
  guardianId: z.string().uuid(),
});
export const childParamsSchema = z.object({ childId: z.string().uuid() });

export const activityCreateSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(4000).nullable().optional(),
  activityAt: z.coerce.date().optional(),
});

const dateOnly = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  });

export const activityPlanQuerySchema = z.object({
  period: z.enum(['WEEK', 'MONTH']),
  periodStart: dateOnly,
});

export const activityPlanCreateSchema = z.object({
  period: z.enum(['WEEK', 'MONTH']),
  periodStart: dateOnly,
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(4000).nullable().optional(),
  plannedFor: z.coerce.date().nullable().optional(),
});

export const activityPlanUpdateSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().max(4000).nullable().optional(),
  plannedFor: z.coerce.date().nullable().optional(),
  status: z.enum(['PLANNED', 'COMPLETED', 'CANCELLED']).optional(),
}).refine((value) => Object.keys(value).length > 0);

export const goalCreateSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(4000).nullable().optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'ACHIEVED', 'ON_HOLD']).optional(),
  targetDate: z.coerce.date().nullable().optional(),
});
export const goalUpdateSchema = goalCreateSchema.partial().refine((value) => Object.keys(value).length > 0);

export const performanceRatingCreateSchema = z.object({
  category: z.string().trim().min(1).max(100),
  score: z.number().int().min(1).max(5),
  notes: z.string().trim().max(2000).nullable().optional(),
  ratedAt: z.coerce.date().optional(),
});

export const mediaParamsSchema = z.object({ id: z.string().uuid() });
export const mediaQuerySchema = z.object({ activityId: z.string().uuid().optional() });

export const childGuardianCreateSchema = z.object({
  childId: z.string().uuid(),
  guardianId: z.string().uuid(),
  relationship: z.string().trim().min(1).max(50),
  isPrimaryContact: z.boolean().default(false),
  canPickup: z.boolean().default(false),
});

export const staffAssignmentCreateSchema = z.object({
  staffProfileId: z.string().uuid(),
  childId: z.string().uuid(),
  startsAt: z.coerce.date().optional(),
});