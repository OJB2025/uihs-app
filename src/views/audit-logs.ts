import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { auditLogSerializer } from '../serializers/audit-logs.js';

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().uuid().optional(),
});

export async function listAuditLogsView(request: FastifyRequest, reply: FastifyReply) {
  const query = querySchema.safeParse(request.query);
  if (!query.success) {
    return reply.code(400).send({ error: 'Invalid query', details: query.error.flatten() });
  }

  if (query.data.cursor) {
    const cursorEntry = await prisma.auditLog.findUnique({
      where: { id: query.data.cursor },
      select: { id: true },
    });
    if (!cursorEntry) return reply.code(400).send({ error: 'Invalid audit cursor' });
  }

  const rows = await prisma.auditLog.findMany({
    ...(query.data.cursor ? { cursor: { id: query.data.cursor }, skip: 1 } : {}),
    take: query.data.limit + 1,
    orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
    include: { actor: { select: { id: true, username: true, role: true } } },
  });
  const hasMore = rows.length > query.data.limit;
  const entries = rows.slice(0, query.data.limit).map((row) => auditLogSerializer.parse(row));

  return {
    entries,
    nextCursor: hasMore ? entries.at(-1)?.id ?? null : null,
  };
}