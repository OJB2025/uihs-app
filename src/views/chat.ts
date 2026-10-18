import type { FastifyReply, FastifyRequest } from 'fastify';
import { UserRole } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { conversationParamsSchema, createConversationSchema, createMessageSchema } from '../schemas/chat.js';
import { chatStaffSerializer, conversationSerializer, messageSerializer } from '../serializers/chat.js';

const chatUserSelect = { id: true, username: true, role: true } as const;
const conversationInclude = {
  admin: { select: chatUserSelect },
  staff: { select: chatUserSelect },
  peerStaff: { select: chatUserSelect },
  messages: {
    take: 1,
    orderBy: { createdAt: 'desc' as const },
    include: { sender: { select: chatUserSelect } },
  },
};

function invalidInput(reply: FastifyReply, details: unknown) {
  return reply.code(400).send({ error: 'Invalid request', details });
}

function requireChatRole(request: FastifyRequest, reply: FastifyReply) {
  if (request.user.role === 'GUARDIAN') {
    reply.code(403).send({ error: 'Chat is available to admins and staff only' });
    return false;
  }
  return true;
}

async function findParticipantConversation(request: FastifyRequest, id: string) {
  if (request.user.role === 'GUARDIAN') return null;
  return prisma.conversation.findFirst({
    where: request.user.role === 'ADMIN'
      ? { id, adminId: request.user.sub }
      : { id, OR: [{ staffId: request.user.sub }, { peerStaffId: request.user.sub }] },
  });
}

function serializeConversation(conversation: {
  id: string;
  adminId: string | null;
  staffId: string;
  peerStaffId: string | null;
  admin: { id: string; username: string; role: UserRole } | null;
  staff: { id: string; username: string; role: UserRole };
  peerStaff: { id: string; username: string; role: UserRole } | null;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  messages: Array<{
    id: string;
    conversationId: string;
    senderId: string;
    body: string;
    createdAt: Date;
    sender: { id: string; username: string; role: UserRole };
  }>;
}) {
  return conversationSerializer.parse({
    ...conversation,
    lastMessage: conversation.messages[0] ?? null,
  });
}

export async function listConversationsView(request: FastifyRequest, reply: FastifyReply) {
  if (!requireChatRole(request, reply)) return;
  const conversations = await prisma.conversation.findMany({
    where: request.user.role === 'ADMIN'
      ? { adminId: request.user.sub }
      : { OR: [{ staffId: request.user.sub }, { peerStaffId: request.user.sub }] },
    include: conversationInclude,
    orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
  });
  return conversations.map(serializeConversation);
}

export async function listChatStaffView(request: FastifyRequest, reply: FastifyReply) {
  if (request.user.role === 'GUARDIAN') {
    return reply.code(403).send({ error: 'Chat is available to admins and staff only' });
  }
  const staff = await prisma.user.findMany({
    where: { role: UserRole.STAFF, isActive: true, id: { not: request.user.sub } },
    select: {
      id: true,
      username: true,
      staffProfile: { select: { firstName: true, lastName: true, jobTitle: true } },
    },
    orderBy: { username: 'asc' },
  });
  return staff.map((profile) => chatStaffSerializer.parse(profile));
}

export async function createConversationView(request: FastifyRequest, reply: FastifyReply) {
  const input = createConversationSchema.safeParse(request.body);
  if (!input.success) return invalidInput(reply, input.error.flatten());

  const staff = await prisma.user.findFirst({
    where: { id: input.data.staffUserId, role: UserRole.STAFF, isActive: true },
    select: { id: true },
  });
  if (!staff) return reply.code(404).send({ error: 'Active staff account not found' });

  const conversation = await prisma.conversation.upsert({
    where: { adminId_staffId: { adminId: request.user.sub, staffId: staff.id } },
    create: { adminId: request.user.sub, staffId: staff.id },
    update: {},
    include: conversationInclude,
  });
  return reply.code(200).send(serializeConversation(conversation));
}

export async function createStaffConversationView(request: FastifyRequest, reply: FastifyReply) {
  if (request.user.role !== 'STAFF') {
    return reply.code(403).send({ error: 'Only staff can start a staff-to-staff conversation' });
  }
  const input = createConversationSchema.safeParse(request.body);
  if (!input.success) return invalidInput(reply, input.error.flatten());
  if (input.data.staffUserId === request.user.sub) {
    return invalidInput(reply, { staffUserId: ['You cannot start a conversation with yourself'] });
  }

  const otherStaff = await prisma.user.findFirst({
    where: { id: input.data.staffUserId, role: UserRole.STAFF, isActive: true },
    select: { id: true },
  });
  if (!otherStaff) return reply.code(404).send({ error: 'Active staff account not found' });

  const [staffId, peerStaffId] = [request.user.sub, otherStaff.id].sort();
  const conversation = await prisma.conversation.upsert({
    where: { staffId_peerStaffId: { staffId, peerStaffId } },
    create: { staffId, peerStaffId },
    update: {},
    include: conversationInclude,
  });
  return reply.code(200).send(serializeConversation(conversation));
}

export async function listMessagesView(request: FastifyRequest, reply: FastifyReply) {
  if (!requireChatRole(request, reply)) return;
  const params = conversationParamsSchema.safeParse(request.params);
  if (!params.success) return invalidInput(reply, params.error.flatten());
  const conversation = await findParticipantConversation(request, params.data.id);
  if (!conversation) return reply.code(404).send({ error: 'Conversation not found' });

  const messages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    include: { sender: { select: chatUserSelect } },
    orderBy: { createdAt: 'asc' },
  });
  return messages.map((message) => messageSerializer.parse(message));
}

export async function createMessageView(request: FastifyRequest, reply: FastifyReply) {
  if (!requireChatRole(request, reply)) return;
  const params = conversationParamsSchema.safeParse(request.params);
  const input = createMessageSchema.safeParse(request.body);
  if (!params.success) return invalidInput(reply, params.error.flatten());
  if (!input.success) return invalidInput(reply, input.error.flatten());
  const conversation = await findParticipantConversation(request, params.data.id);
  if (!conversation) return reply.code(404).send({ error: 'Conversation not found' });

  const createdAt = new Date();
  const message = await prisma.$transaction(async (transaction) => {
    const created = await transaction.message.create({
      data: {
        conversationId: conversation.id,
        senderId: request.user.sub,
        body: input.data.body,
        createdAt,
      },
      include: { sender: { select: chatUserSelect } },
    });
    await transaction.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: createdAt },
    });
    return created;
  });
  return reply.code(201).send(messageSerializer.parse(message));
}