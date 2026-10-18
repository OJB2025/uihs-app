import type { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../auth.js';
import { listNotificationsView, markNotificationReadView } from '../views/reviews.js';

export const notificationUrls: FastifyPluginAsync = async (app) => {
  app.get('/notifications', { preHandler: authenticate }, listNotificationsView);
  app.patch('/notifications/:id/read', { preHandler: authenticate }, markNotificationReadView);
};