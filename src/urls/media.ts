import type { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../auth.js';
import { mediaContentView, mediaDownloadView } from '../views/media.js';

export const mediaUrls: FastifyPluginAsync = async (app) => {
  app.get('/media/:id/content', { preHandler: authenticate }, mediaContentView);
  app.get('/media/:id/download', { preHandler: authenticate }, mediaDownloadView);
};