import type { FastifyPluginAsync } from 'fastify';
import { requireAdmin } from '../auth.js';
import { approveGuardianView, listApprovalRequestsView, rejectGuardianView } from '../views/approvals.js';

export const approvalUrls: FastifyPluginAsync = async (app) => {
  app.get('/admin/approval-requests', { preHandler: requireAdmin }, listApprovalRequestsView);
  app.patch('/admin/approval-requests/:id/approve', { preHandler: requireAdmin }, approveGuardianView);
  app.patch('/admin/approval-requests/:id/reject', { preHandler: requireAdmin }, rejectGuardianView);
};