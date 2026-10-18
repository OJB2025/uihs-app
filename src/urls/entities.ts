import type { FastifyPluginAsync } from 'fastify';
import { authenticate, requireAdmin } from '../auth.js';
import {
  createChildGuardianView,
  createChildView,
  createGuardianView,
  createStaffAssignmentView,
  createStaffView,
  currentUserView,
  deactivateGuardianView,
  deactivateStaffView,
  endStaffAssignmentView,
  getChildView,
  getGuardianView,
  getStaffView,
  listChildGuardiansView,
  listChildrenView,
  listGuardiansView,
  listStaffAssignmentsView,
  listStaffView,
  archiveChildView,
  deleteChildGuardianView,
  updateChildView,
  updateGuardianView,
  updateStaffView,
} from '../views/entities.js';

export const entityUrls: FastifyPluginAsync = async (app) => {
  app.get('/me', { preHandler: authenticate }, currentUserView);

  app.get('/staff', { preHandler: requireAdmin }, listStaffView);
  app.post('/staff', { preHandler: requireAdmin }, createStaffView);
  app.get('/staff/:id', { preHandler: requireAdmin }, getStaffView);
  app.patch('/staff/:id', { preHandler: requireAdmin }, updateStaffView);
  app.delete('/staff/:id', { preHandler: requireAdmin }, deactivateStaffView);

  app.get('/guardians', { preHandler: requireAdmin }, listGuardiansView);
  app.post('/guardians', { preHandler: requireAdmin }, createGuardianView);
  app.get('/guardians/:id', { preHandler: requireAdmin }, getGuardianView);
  app.patch('/guardians/:id', { preHandler: requireAdmin }, updateGuardianView);
  app.delete('/guardians/:id', { preHandler: requireAdmin }, deactivateGuardianView);

  app.get('/children', { preHandler: authenticate }, listChildrenView);
  app.post('/children', { preHandler: requireAdmin }, createChildView);
  app.get('/children/:id', { preHandler: authenticate }, getChildView);
  app.patch('/children/:id', { preHandler: requireAdmin }, updateChildView);
  app.delete('/children/:id', { preHandler: requireAdmin }, archiveChildView);

  app.get('/child-guardians', { preHandler: requireAdmin }, listChildGuardiansView);
  app.post('/child-guardians', { preHandler: requireAdmin }, createChildGuardianView);
  app.delete('/child-guardians/:childId/:guardianId', { preHandler: requireAdmin }, deleteChildGuardianView);

  app.get('/staff-assignments', { preHandler: requireAdmin }, listStaffAssignmentsView);
  app.post('/staff-assignments', { preHandler: requireAdmin }, createStaffAssignmentView);
  app.post('/staff-assignments/:id/end', { preHandler: requireAdmin }, endStaffAssignmentView);
};