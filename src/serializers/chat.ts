import { z } from 'zod';

export const chatUserSerializer = z.object({
  id: z.string().uuid(),
  username: z.string(),
  role: z.enum(['ADMIN', 'STAFF']),
});

export const messageSerializer = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  senderId: z.string().uuid(),
  body: z.string(),
  createdAt: z.date(),
  sender: chatUserSerializer,
});

export const conversationSerializer = z.object({
  id: z.string().uuid(),
  adminId: z.string().uuid().nullable(),
  staffId: z.string().uuid(),
  peerStaffId: z.string().uuid().nullable(),
  admin: chatUserSerializer.nullable(),
  staff: chatUserSerializer,
  peerStaff: chatUserSerializer.nullable(),
  lastMessageAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastMessage: messageSerializer.nullable(),
});

export const chatStaffSerializer = z.object({
  id: z.string().uuid(),
  username: z.string(),
  staffProfile: z.object({
    firstName: z.string(),
    lastName: z.string(),
    jobTitle: z.string().nullable(),
  }).nullable(),
});