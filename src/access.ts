import type { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from './lib/prisma.js';

export async function assertChildAccess(
  request: FastifyRequest,
  reply: FastifyReply,
  childId: string,
  write = false,
) {
  if (write && request.user.role === 'GUARDIAN') {
    reply.code(403).send({ error: 'Guardians have read-only access' });
    return false;
  }

  const where = request.user.role === 'ADMIN'
    ? { id: childId }
    : request.user.role === 'STAFF'
      ? { id: childId, staffAssignments: { some: { staffProfile: { userId: request.user.sub }, endsAt: null } } }
      : { id: childId, guardians: { some: { guardian: { userId: request.user.sub } } } };

  const child = await prisma.child.findFirst({ where, select: { id: true } });
  if (!child) {
    reply.code(404).send({ error: 'Child not found' });
    return false;
  }
  return true;
}