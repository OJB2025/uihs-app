import type { FastifyInstance } from 'fastify';
import { prisma } from './lib/prisma.js';

export function registerAuditLog(app: FastifyInstance) {
  app.addHook('onResponse', async (request, reply) => {
    if (!request.user?.sub || !request.routeOptions.url?.startsWith('/api/')) return;

    try {
      await prisma.auditLog.create({
        data: {
          actorId: request.user.sub,
          method: request.method,
          route: request.routeOptions.url,
          statusCode: reply.statusCode,
        },
      });
    } catch (error) {
      request.log.error({ err: error }, 'Failed to write audit log entry');
    }
  });
}