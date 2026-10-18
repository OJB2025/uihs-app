import type { FastifyPluginAsync } from 'fastify';
import { authenticate, requireAdmin } from '../auth.js';
import {
  createConversationView,
  createMessageView,
  createStaffConversationView,
  listChatStaffView,
  listConversationsView,
  listMessagesView,
} from '../views/chat.js';

export const chatUrls: FastifyPluginAsync = async (app) => {
  app.get('/chat/conversations', { preHandler: authenticate }, listConversationsView);
  app.get('/chat/staff', { preHandler: authenticate }, listChatStaffView);
  app.post('/chat/conversations', { preHandler: requireAdmin }, createConversationView);
  app.post('/chat/staff-conversations', { preHandler: authenticate }, createStaffConversationView);
  app.get('/chat/conversations/:id/messages', { preHandler: authenticate }, listMessagesView);
  app.post('/chat/conversations/:id/messages', {
    preHandler: authenticate,
    config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
  }, createMessageView);
};