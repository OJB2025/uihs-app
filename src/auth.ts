import type { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from './lib/prisma.js';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; role: 'ADMIN' | 'STAFF' | 'GUARDIAN' };
    user: { sub: string; role: 'ADMIN' | 'STAFF' | 'GUARDIAN' };
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    return reply.code(401).send({ error: 'Authentication required' });
  }

  const user = await prisma.user.findUnique({
    where: { id: request.user.sub },
    select: { isActive: true, role: true },
  });
  if (!user?.isActive || user.role !== request.user.role) {
    return reply.code(401).send({ error: 'Authentication required' });
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const result = await authenticate(request, reply);
  if (result) return result;

  if (request.user.role !== 'ADMIN') {
    return reply.code(403).send({ error: 'Administrator access required' });
  }
}