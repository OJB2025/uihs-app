import { createWriteStream, createReadStream } from 'node:fs';
import { mkdir, stat, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join, resolve, sep } from 'node:path';
import { pipeline } from 'node:stream/promises';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { MediaKind } from '@prisma/client';
import { assertChildAccess } from '../access.js';
import { prisma } from '../lib/prisma.js';
import { childParamsSchema, mediaParamsSchema, mediaQuerySchema } from '../schemas/entities.js';
import { mediaAssetSerializer } from '../serializers/entities.js';

const mediaDirectory = resolve(process.env.MEDIA_STORAGE_DIR ?? '.data/media');
const uploadTypes = new Map<string, MediaKind>([
  ['image/jpeg', MediaKind.IMAGE],
  ['image/png', MediaKind.IMAGE],
  ['image/webp', MediaKind.IMAGE],
  ['video/mp4', MediaKind.VIDEO],
  ['video/webm', MediaKind.VIDEO],
]);

function invalidInput(reply: FastifyReply, details: unknown) {
  return reply.code(400).send({ error: 'Invalid request', details });
}

export async function listMediaView(request: FastifyRequest, reply: FastifyReply) {
  const params = childParamsSchema.safeParse(request.params);
  if (!params.success) return invalidInput(reply, params.error.flatten());
  const { childId } = params.data;
  if (!(await assertChildAccess(request, reply, childId))) return;
  const assets = await prisma.mediaAsset.findMany({
    where: { childId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, childId: true, activityId: true, kind: true, originalName: true, mimeType: true, sizeBytes: true, createdAt: true },
  });
  return assets.map((asset) => ({
    ...mediaAssetSerializer.parse(asset),
    contentUrl: `/api/media/${asset.id}/content`,
  }));
}

export async function uploadMediaView(request: FastifyRequest, reply: FastifyReply) {
  const params = childParamsSchema.safeParse(request.params);
  const query = mediaQuerySchema.safeParse(request.query);
  if (!params.success) return invalidInput(reply, params.error.flatten());
  if (!query.success) return invalidInput(reply, query.error.flatten());
  const { childId } = params.data;
  if (!(await assertChildAccess(request, reply, childId, true))) return;

  if (query.data.activityId) {
    const activity = await prisma.activity.findFirst({
      where: { id: query.data.activityId, childId },
      select: { id: true },
    });
    if (!activity) return reply.code(404).send({ error: 'Activity not found for this child' });
  }

  const file = await request.file();
  if (!file) return reply.code(400).send({ error: 'A picture or video file is required' });
  const kind = uploadTypes.get(file.mimetype);
  if (!kind) {
    file.file.resume();
    return reply.code(415).send({ error: 'Supported types are JPEG, PNG, WebP, MP4, and WebM' });
  }

  await mkdir(mediaDirectory, { recursive: true, mode: 0o700 });
  const storageKey = randomUUID();
  const filePath = join(mediaDirectory, storageKey);
  try {
    await pipeline(file.file, createWriteStream(filePath, { flags: 'wx', mode: 0o600 }));
    if (file.file.truncated) {
      await unlink(filePath);
      return reply.code(413).send({ error: 'File exceeds the 100 MB upload limit' });
    }

    const fileStats = await stat(filePath);
    const asset = await prisma.mediaAsset.create({
      data: {
        childId,
        activityId: query.data.activityId,
        uploadedById: request.user.sub,
        kind,
        originalName: file.filename.replace(/[\\/]/g, '_').slice(0, 255),
        mimeType: file.mimetype,
        storageKey,
        sizeBytes: fileStats.size,
      },
      select: { id: true, childId: true, activityId: true, kind: true, originalName: true, mimeType: true, sizeBytes: true, createdAt: true },
    });
    return reply.code(201).send({
      ...mediaAssetSerializer.parse(asset),
      contentUrl: `/api/media/${asset.id}/content`,
    });
  } catch (error) {
    await unlink(filePath).catch(() => undefined);
    throw error;
  }
}

async function serveMedia(request: FastifyRequest, reply: FastifyReply, asAttachment: boolean) {
  const params = mediaParamsSchema.safeParse(request.params);
  if (!params.success) return invalidInput(reply, params.error.flatten());
  const asset = await prisma.mediaAsset.findUnique({ where: { id: params.data.id } });
  if (!asset) return reply.code(404).send({ error: 'Media not found' });
  if (!(await assertChildAccess(request, reply, asset.childId))) return;

  const filePath = resolve(mediaDirectory, asset.storageKey);
  if (!filePath.startsWith(`${mediaDirectory}${sep}`)) {
    return reply.code(404).send({ error: 'Media not found' });
  }
  let fileStats;
  try {
    fileStats = await stat(filePath);
  } catch {
    return reply.code(404).send({ error: 'Media file not found' });
  }

  const filename = encodeURIComponent(asset.originalName).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return reply
    .header('Cache-Control', 'private, no-store')
    .header('Content-Disposition', `${asAttachment ? 'attachment' : 'inline'}; filename*=UTF-8''${filename}`)
    .header('Content-Length', String(fileStats.size))
    .type(asset.mimeType)
    .send(createReadStream(filePath));
}

export async function mediaContentView(request: FastifyRequest, reply: FastifyReply) {
  return serveMedia(request, reply, false);
}

export async function mediaDownloadView(request: FastifyRequest, reply: FastifyReply) {
  return serveMedia(request, reply, true);
}