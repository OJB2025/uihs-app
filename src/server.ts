import 'dotenv/config';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import Fastify from 'fastify';
import { z } from 'zod';
import { registerAuditLog } from './audit.js';
import { authUrls } from './urls/auth.js';
import { approvalUrls } from './urls/approvals.js';
import { auditLogUrls } from './urls/audit-logs.js';
import { chatUrls } from './urls/chat.js';
import { childContentUrls } from './urls/child-content.js';
import { entityUrls } from './urls/entities.js';
import { mediaUrls } from './urls/media.js';
import { notificationUrls } from './urls/notifications.js';
import { reviewUrls } from './urls/reviews.js';

const environmentSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  CORS_ORIGIN: z.string().optional(),
  JWT_SECRET: z.string().min(32),
});

const environment = environmentSchema.parse(process.env);
const app = Fastify({ logger: true });
const allowedOrigins = environment.CORS_ORIGIN
  ?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

await app.register(helmet);
await app.register(cors, { origin: allowedOrigins?.length ? allowedOrigins : false });
await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });
await app.register(jwt, { secret: environment.JWT_SECRET });
await app.register(multipart, { limits: { fileSize: 100 * 1024 * 1024, files: 1 } });
registerAuditLog(app);
await app.register(authUrls, { prefix: '/api' });
await app.register(auditLogUrls, { prefix: '/api' });
await app.register(approvalUrls, { prefix: '/api' });
await app.register(chatUrls, { prefix: '/api' });
await app.register(entityUrls, { prefix: '/api' });
await app.register(childContentUrls, { prefix: '/api/children' });
await app.register(mediaUrls, { prefix: '/api' });
await app.register(reviewUrls, { prefix: '/api' });
await app.register(notificationUrls, { prefix: '/api' });

app.get('/health', async () => ({ status: 'ok' }));

try {
  await app.listen({ host: '0.0.0.0', port: environment.PORT });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}