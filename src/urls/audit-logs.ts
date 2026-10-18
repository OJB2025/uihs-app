import type { FastifyPluginAsync } from 'fastify';
import { requireAdmin } from '../auth.js';
import { listAuditLogsView } from '../views/audit-logs.js';

export const auditLogUrls: FastifyPluginAsync = async (app) => {
  app.get('/admin/audit-logs', { preHandler: requireAdmin }, listAuditLogsView);
};