import type { FastifyPluginAsync } from 'fastify';
import { createRoleLoginView, registerGuardianView } from '../views/auth.js';

export const authUrls: FastifyPluginAsync = async (app) => {
  app.post('/auth/admin/login', { config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } }, createRoleLoginView('ADMIN'));
  app.post('/auth/staff/login', { config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } }, createRoleLoginView('STAFF'));
  app.post('/auth/guardian/login', { config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } }, createRoleLoginView('GUARDIAN'));
  app.post('/auth/register', { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } } }, registerGuardianView);
};