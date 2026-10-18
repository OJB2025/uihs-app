import type { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../auth.js';
import {
  createActivityView,
  createGoalView,
  createRatingView,
  listActivitiesView,
  listGoalsView,
  listRatingsView,
  updateGoalView,
} from '../views/child-content.js';
import { listMediaView, uploadMediaView } from '../views/media.js';
import {
  createActivityPlanView,
  listActivityPlansView,
  updateActivityPlanView,
} from '../views/activity-plans.js';

export const childContentUrls: FastifyPluginAsync = async (app) => {
  app.get('/:childId/activities', { preHandler: authenticate }, listActivitiesView);
  app.post('/:childId/activities', { preHandler: authenticate }, createActivityView);
  app.get('/:childId/activity-plans', { preHandler: authenticate }, listActivityPlansView);
  app.post('/:childId/activity-plans', { preHandler: authenticate }, createActivityPlanView);
  app.patch('/activity-plans/:id', { preHandler: authenticate }, updateActivityPlanView);
  app.get('/:childId/goals', { preHandler: authenticate }, listGoalsView);
  app.post('/:childId/goals', { preHandler: authenticate }, createGoalView);
  app.get('/:childId/ratings', { preHandler: authenticate }, listRatingsView);
  app.post('/:childId/ratings', { preHandler: authenticate }, createRatingView);
  app.patch('/goals/:id', { preHandler: authenticate }, updateGoalView);
  app.get('/:childId/media', { preHandler: authenticate }, listMediaView);
  app.post('/:childId/media', {
    preHandler: authenticate,
    config: { rateLimit: { max: 10, timeWindow: '1 hour' } },
  }, uploadMediaView);
};