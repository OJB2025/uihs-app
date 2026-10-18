import type { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../auth.js';
import { createReviewView, listReviewsView, respondToReviewView } from '../views/reviews.js';

export const reviewUrls: FastifyPluginAsync = async (app) => {
  app.get('/children/:childId/reviews', { preHandler: authenticate }, listReviewsView);
  app.post('/children/:childId/reviews', {
    preHandler: authenticate,
    config: { rateLimit: { max: 10, timeWindow: '1 hour' } },
  }, createReviewView);
  app.patch('/children/:childId/reviews/:reviewId/response', { preHandler: authenticate }, respondToReviewView);
};