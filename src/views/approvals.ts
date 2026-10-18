import { AccountApprovalStatus, UserRole } from '@prisma/client';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { approvalRequestSerializer, approvalResultSerializer } from '../serializers/approvals.js';

const paramsSchema = z.object({ id: z.string().uuid() });

function invalidInput(reply: FastifyReply, details: unknown) {
  return reply.code(400).send({ error: 'Invalid request', details });
}

export async function listApprovalRequestsView() {
  const requests = await prisma.user.findMany({
    where: { role: UserRole.GUARDIAN, approvalStatus: AccountApprovalStatus.PENDING },
    select: {
      id: true,
      username: true,
      email: true,
      createdAt: true,
      guardianProfile: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  return requests.map((request) => approvalRequestSerializer.parse(request));
}

export async function approveGuardianView(request: FastifyRequest, reply: FastifyReply) {
  const params = paramsSchema.safeParse(request.params);
  if (!params.success) return invalidInput(reply, params.error.flatten());
  const result = await prisma.user.updateMany({
    where: {
      id: params.data.id,
      role: UserRole.GUARDIAN,
      approvalStatus: AccountApprovalStatus.PENDING,
    },
    data: { approvalStatus: AccountApprovalStatus.APPROVED, isActive: true },
  });
  if (result.count === 0) return reply.code(404).send({ error: 'Pending guardian request not found' });
  return approvalResultSerializer.parse({ id: params.data.id, approvalStatus: AccountApprovalStatus.APPROVED });
}

export async function rejectGuardianView(request: FastifyRequest, reply: FastifyReply) {
  const params = paramsSchema.safeParse(request.params);
  if (!params.success) return invalidInput(reply, params.error.flatten());
  const result = await prisma.user.updateMany({
    where: {
      id: params.data.id,
      role: UserRole.GUARDIAN,
      approvalStatus: AccountApprovalStatus.PENDING,
    },
    data: { approvalStatus: AccountApprovalStatus.REJECTED, isActive: false },
  });
  if (result.count === 0) return reply.code(404).send({ error: 'Pending guardian request not found' });
  return approvalResultSerializer.parse({ id: params.data.id, approvalStatus: AccountApprovalStatus.REJECTED });
}