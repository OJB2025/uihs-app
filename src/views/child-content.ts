import type { FastifyReply, FastifyRequest } from 'fastify';
import { assertChildAccess } from '../access.js';
import { prisma } from '../lib/prisma.js';
import {
  activityCreateSchema,
  childParamsSchema,
  goalCreateSchema,
  goalUpdateSchema,
  idParamsSchema,
  performanceRatingCreateSchema,
} from '../schemas/entities.js';
import {
  activitySerializer,
  goalSerializer,
  performanceRatingSerializer,
} from '../serializers/entities.js';

function invalidInput(reply: FastifyReply, details: unknown) {
  return reply.code(400).send({ error: 'Invalid request', details });
}

function readChildId(request: FastifyRequest, reply: FastifyReply) {
  const parsed = childParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    invalidInput(reply, parsed.error.flatten());
    return undefined;
  }
  return parsed.data.childId;
}

export async function listActivitiesView(request: FastifyRequest, reply: FastifyReply) {
  const childId = readChildId(request, reply);
  if (!childId || !(await assertChildAccess(request, reply, childId))) return;
  const records = await prisma.activity.findMany({ where: { childId }, orderBy: { activityAt: 'desc' } });
  return records.map((record) => activitySerializer.parse(record));
}

export async function createActivityView(request: FastifyRequest, reply: FastifyReply) {
  const childId = readChildId(request, reply);
  if (!childId || !(await assertChildAccess(request, reply, childId, true))) return;
  const input = activityCreateSchema.safeParse(request.body);
  if (!input.success) return invalidInput(reply, input.error.flatten());
  const record = await prisma.activity.create({
    data: { ...input.data, childId, createdById: request.user.sub },
  });
  return reply.code(201).send(activitySerializer.parse(record));
}

export async function listGoalsView(request: FastifyRequest, reply: FastifyReply) {
  const childId = readChildId(request, reply);
  if (!childId || !(await assertChildAccess(request, reply, childId))) return;
  const records = await prisma.goal.findMany({ where: { childId }, orderBy: { createdAt: 'desc' } });
  return records.map((record) => goalSerializer.parse(record));
}

export async function createGoalView(request: FastifyRequest, reply: FastifyReply) {
  const childId = readChildId(request, reply);
  if (!childId || !(await assertChildAccess(request, reply, childId, true))) return;
  const input = goalCreateSchema.safeParse(request.body);
  if (!input.success) return invalidInput(reply, input.error.flatten());
  const record = await prisma.goal.create({
    data: { ...input.data, childId, createdById: request.user.sub },
  });
  return reply.code(201).send(goalSerializer.parse(record));
}

export async function updateGoalView(request: FastifyRequest, reply: FastifyReply) {
  const params = idParamsSchema.safeParse(request.params);
  if (!params.success) return invalidInput(reply, params.error.flatten());
  const input = goalUpdateSchema.safeParse(request.body);
  if (!input.success) return invalidInput(reply, input.error.flatten());
  if (request.user.role === 'GUARDIAN') {
    return reply.code(403).send({ error: 'Guardians have read-only access' });
  }
  const existing = await prisma.goal.findUnique({ where: { id: params.data.id }, select: { childId: true } });
  if (!existing) return reply.code(404).send({ error: 'Goal not found' });
  if (!(await assertChildAccess(request, reply, existing.childId, true))) return;
  const record = await prisma.goal.update({ where: { id: params.data.id }, data: input.data });
  return goalSerializer.parse(record);
}

export async function listRatingsView(request: FastifyRequest, reply: FastifyReply) {
  const childId = readChildId(request, reply);
  if (!childId || !(await assertChildAccess(request, reply, childId))) return;
  const records = await prisma.performanceRating.findMany({ where: { childId }, orderBy: { ratedAt: 'desc' } });
  return records.map((record) => performanceRatingSerializer.parse(record));
}

export async function createRatingView(request: FastifyRequest, reply: FastifyReply) {
  const childId = readChildId(request, reply);
  if (!childId || !(await assertChildAccess(request, reply, childId, true))) return;
  const input = performanceRatingCreateSchema.safeParse(request.body);
  if (!input.success) return invalidInput(reply, input.error.flatten());
  const record = await prisma.performanceRating.create({
    data: { ...input.data, childId, createdById: request.user.sub },
  });
  return reply.code(201).send(performanceRatingSerializer.parse(record));
}