import { UserRole } from '@prisma/client';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { assertChildAccess } from '../access.js';
import { prisma } from '../lib/prisma.js';
import { notificationParamsSchema, reviewCreateSchema, reviewParamsSchema, reviewResponseParamsSchema, reviewResponseSchema } from '../schemas/reviews.js';
import { notificationSerializer, reviewSerializer } from '../serializers/reviews.js';

function invalidInput(reply: FastifyReply, details: unknown) {
  return reply.code(400).send({ error: 'Invalid request', details });
}

const reviewInclude = {
  author: { select: { id: true, username: true } },
  staffRespondedBy: { select: { id: true, username: true } },
};

export async function listReviewsView(request: FastifyRequest, reply: FastifyReply) {
  const params = reviewParamsSchema.safeParse(request.params);
  if (!params.success) return invalidInput(reply, params.error.flatten());
  const { childId } = params.data;
  if (!(await assertChildAccess(request, reply, childId))) return;

  const where = request.user.role === 'GUARDIAN'
    ? { childId, authorId: request.user.sub }
    : { childId };
  const reviews = await prisma.review.findMany({
    where,
    include: reviewInclude,
    orderBy: { createdAt: 'desc' },
  });
  return reviews.map((review) => reviewSerializer.parse(review));
}

export async function createReviewView(request: FastifyRequest, reply: FastifyReply) {
  if (request.user.role !== 'GUARDIAN') {
    return reply.code(403).send({ error: 'Only guardians can submit reviews' });
  }
  const params = reviewParamsSchema.safeParse(request.params);
  const input = reviewCreateSchema.safeParse(request.body);
  if (!params.success) return invalidInput(reply, params.error.flatten());
  if (!input.success) return invalidInput(reply, input.error.flatten());
  const { childId } = params.data;
  if (!(await assertChildAccess(request, reply, childId))) return;

  const assignments = await prisma.staffAssignment.findMany({
    where: { childId, endsAt: null },
    select: { staffProfile: { select: { userId: true } } },
  });
  const assignedUserIds = [...new Set(assignments.map(({ staffProfile }) => staffProfile.userId))];
  const activeStaff = assignedUserIds.length
    ? await prisma.user.findMany({
        where: { id: { in: assignedUserIds }, role: UserRole.STAFF, isActive: true },
        select: { id: true },
      })
    : [];

  const review = await prisma.$transaction(async (transaction) => {
    const createdReview = await transaction.review.create({
      data: {
        childId,
        authorId: request.user.sub,
        rating: input.data.rating,
        comment: input.data.comment,
      },
      include: reviewInclude,
    });
    if (activeStaff.length) {
      await transaction.notification.createMany({
        data: activeStaff.map(({ id }) => ({ recipientUserId: id, reviewId: createdReview.id })),
      });
    }
    return createdReview;
  });

  return reply.code(201).send(reviewSerializer.parse(review));
}

export async function respondToReviewView(request: FastifyRequest, reply: FastifyReply) {
  if (request.user.role !== 'STAFF' && request.user.role !== 'ADMIN') {
    return reply.code(403).send({ error: 'Only assigned staff can respond to family reviews' });
  }
  const params = reviewResponseParamsSchema.safeParse(request.params);
  const input = reviewResponseSchema.safeParse(request.body);
  if (!params.success) return invalidInput(reply, params.error.flatten());
  if (!input.success) return invalidInput(reply, input.error.flatten());
  if (!(await assertChildAccess(request, reply, params.data.childId, true))) return;

  const review = await prisma.review.findFirst({
    where: { id: params.data.reviewId, childId: params.data.childId },
    select: { id: true },
  });
  if (!review) return reply.code(404).send({ error: 'Family review not found' });

  const updated = await prisma.review.update({
    where: { id: review.id },
    data: {
      staffResponse: input.data.staffResponse,
      staffRespondedById: request.user.sub,
      staffRespondedAt: new Date(),
    },
    include: reviewInclude,
  });
  return reviewSerializer.parse(updated);
}

export async function listNotificationsView(request: FastifyRequest, reply: FastifyReply) {
  if (request.user.role !== 'STAFF') {
    return reply.code(403).send({ error: 'Staff notifications are only available to staff' });
  }
  const notifications = await prisma.notification.findMany({
    where: { recipientUserId: request.user.sub },
    include: {
      review: {
        select: {
          id: true,
          childId: true,
          rating: true,
          comment: true,
          createdAt: true,
          child: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return notifications.map((notification) => notificationSerializer.parse(notification));
}

export async function markNotificationReadView(request: FastifyRequest, reply: FastifyReply) {
  if (request.user.role !== 'STAFF') {
    return reply.code(403).send({ error: 'Staff notifications are only available to staff' });
  }
  const params = notificationParamsSchema.safeParse(request.params);
  if (!params.success) return invalidInput(reply, params.error.flatten());
  const notification = await prisma.notification.findFirst({
    where: { id: params.data.id, recipientUserId: request.user.sub },
    select: { id: true, readAt: true },
  });
  if (!notification) return reply.code(404).send({ error: 'Notification not found' });
  if (!notification.readAt) {
    await prisma.notification.update({
      where: { id: notification.id },
      data: { readAt: new Date() },
    });
  }
  return { id: notification.id, readAt: notification.readAt ?? new Date() };
}