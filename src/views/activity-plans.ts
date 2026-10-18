import type { FastifyReply, FastifyRequest } from 'fastify';
import { assertChildAccess } from '../access.js';
import { prisma } from '../lib/prisma.js';
import {
  activityPlanCreateSchema,
  activityPlanQuerySchema,
  activityPlanUpdateSchema,
  childParamsSchema,
  idParamsSchema,
} from '../schemas/entities.js';
import { activityPlanSerializer } from '../serializers/entities.js';

type PlanPeriod = 'WEEK' | 'MONTH';

function invalidInput(reply: FastifyReply, details: unknown) {
  return reply.code(400).send({ error: 'Invalid request', details });
}

function readPeriodStart(period: PlanPeriod, value: string) {
  const start = new Date(`${value}T00:00:00.000Z`);
  if (period === 'WEEK' && start.getUTCDay() !== 1) return undefined;
  if (period === 'MONTH' && start.getUTCDate() !== 1) return undefined;
  return start;
}

function periodEnd(period: PlanPeriod, start: Date) {
  return period === 'WEEK'
    ? new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)
    : new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
}

function isWithinPeriod(date: Date, period: PlanPeriod, start: Date) {
  return date >= start && date < periodEnd(period, start);
}

export async function listActivityPlansView(request: FastifyRequest, reply: FastifyReply) {
  const params = childParamsSchema.safeParse(request.params);
  const query = activityPlanQuerySchema.safeParse(request.query);
  if (!params.success) return invalidInput(reply, params.error.flatten());
  if (!query.success) return invalidInput(reply, query.error.flatten());
  const start = readPeriodStart(query.data.period, query.data.periodStart);
  if (!start) return invalidInput(reply, { periodStart: ['Use Monday for WEEK or the first day for MONTH'] });
  if (!(await assertChildAccess(request, reply, params.data.childId))) return;

  const plans = await prisma.activityPlan.findMany({
    where: { childId: params.data.childId, period: query.data.period, periodStart: start },
    orderBy: [{ plannedFor: 'asc' }, { createdAt: 'asc' }],
  });
  return plans.map((plan) => activityPlanSerializer.parse(plan));
}

export async function createActivityPlanView(request: FastifyRequest, reply: FastifyReply) {
  const params = childParamsSchema.safeParse(request.params);
  const input = activityPlanCreateSchema.safeParse(request.body);
  if (!params.success) return invalidInput(reply, params.error.flatten());
  if (!input.success) return invalidInput(reply, input.error.flatten());
  const start = readPeriodStart(input.data.period, input.data.periodStart);
  if (!start) return invalidInput(reply, { periodStart: ['Use Monday for WEEK or the first day for MONTH'] });
  if (input.data.plannedFor && !isWithinPeriod(input.data.plannedFor, input.data.period, start)) {
    return invalidInput(reply, { plannedFor: ['The date must fall within the selected period'] });
  }
  const { periodStart: _periodStart, ...inputData } = input.data;
  if (!(await assertChildAccess(request, reply, params.data.childId, true))) return;

  const plan = await prisma.activityPlan.create({
    data: {
      ...inputData,
      childId: params.data.childId,
      createdById: request.user.sub,
      periodStart: start,
    },
  });
  return reply.code(201).send(activityPlanSerializer.parse(plan));
}

export async function updateActivityPlanView(request: FastifyRequest, reply: FastifyReply) {
  const params = idParamsSchema.safeParse(request.params);
  const input = activityPlanUpdateSchema.safeParse(request.body);
  if (!params.success) return invalidInput(reply, params.error.flatten());
  if (!input.success) return invalidInput(reply, input.error.flatten());
  const existing = await prisma.activityPlan.findUnique({
    where: { id: params.data.id },
    select: { childId: true, period: true, periodStart: true },
  });
  if (!existing) return reply.code(404).send({ error: 'Activity plan not found' });
  if (input.data.plannedFor && !isWithinPeriod(input.data.plannedFor, existing.period, existing.periodStart)) {
    return invalidInput(reply, { plannedFor: ['The date must fall within the activity plan period'] });
  }
  if (!(await assertChildAccess(request, reply, existing.childId, true))) return;
  const plan = await prisma.activityPlan.update({ where: { id: params.data.id }, data: input.data });
  return activityPlanSerializer.parse(plan);
}