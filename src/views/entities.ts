import argon2 from 'argon2';
import { Prisma, UserRole } from '@prisma/client';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma.js';
import {
  childCreateSchema,
  childGuardianCreateSchema,
  childGuardianParamsSchema,
  childUpdateSchema,
  guardianCreateSchema,
  guardianUpdateSchema,
  idParamsSchema,
  staffAssignmentCreateSchema,
  staffCreateSchema,
  staffUpdateSchema,
} from '../schemas/entities.js';
import {
  childGuardianSerializer,
  childSerializer,
  guardianSerializer,
  publicUserSchema,
  staffAssignmentSerializer,
  staffSerializer,
} from '../serializers/entities.js';

const publicUserSelect = {
  id: true,
  username: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const profileInclude = { user: { select: publicUserSelect } };

function invalidInput(reply: FastifyReply, details: unknown) {
  return reply.code(400).send({ error: 'Invalid request', details });
}

function readId(request: FastifyRequest, reply: FastifyReply) {
  const parsed = idParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    invalidInput(reply, parsed.error.flatten());
    return undefined;
  }
  return parsed.data.id;
}

export async function listStaffView() {
  const profiles = await prisma.staffProfile.findMany({ include: profileInclude });
  return profiles.map((profile) => staffSerializer.parse(profile));
}

export async function createStaffView(request: FastifyRequest, reply: FastifyReply) {
  const input = staffCreateSchema.safeParse(request.body);
  if (!input.success) return invalidInput(reply, input.error.flatten());
  const { username, email, password, ...profile } = input.data;

  const created = await prisma.staffProfile.create({
    data: {
      ...profile,
      user: { create: { username, email, passwordHash: await argon2.hash(password), role: UserRole.STAFF } },
    },
    include: profileInclude,
  });
  return reply.code(201).send(staffSerializer.parse(created));
}

export async function getStaffView(request: FastifyRequest, reply: FastifyReply) {
  const id = readId(request, reply);
  if (!id) return;
  const profile = await prisma.staffProfile.findUnique({ where: { id }, include: profileInclude });
  if (!profile) return reply.code(404).send({ error: 'Staff member not found' });
  return staffSerializer.parse(profile);
}

export async function updateStaffView(request: FastifyRequest, reply: FastifyReply) {
  const id = readId(request, reply);
  if (!id) return;
  const input = staffUpdateSchema.safeParse(request.body);
  if (!input.success) return invalidInput(reply, input.error.flatten());
  const profile = await prisma.staffProfile.update({ where: { id }, data: input.data, include: profileInclude });
  return staffSerializer.parse(profile);
}

export async function deactivateStaffView(request: FastifyRequest, reply: FastifyReply) {
  const id = readId(request, reply);
  if (!id) return;
  const profile = await prisma.staffProfile.findUnique({ where: { id }, select: { userId: true } });
  if (!profile) return reply.code(404).send({ error: 'Staff member not found' });
  await prisma.user.update({ where: { id: profile.userId }, data: { isActive: false } });
  return reply.code(204).send();
}

export async function listGuardiansView() {
  const profiles = await prisma.guardianProfile.findMany({ include: profileInclude });
  return profiles.map((profile) => guardianSerializer.parse(profile));
}

export async function createGuardianView(request: FastifyRequest, reply: FastifyReply) {
  const input = guardianCreateSchema.safeParse(request.body);
  if (!input.success) return invalidInput(reply, input.error.flatten());
  const { username, email, password, ...profile } = input.data;

  const created = await prisma.guardianProfile.create({
    data: {
      ...profile,
      user: { create: { username, email, passwordHash: await argon2.hash(password), role: UserRole.GUARDIAN } },
    },
    include: profileInclude,
  });
  return reply.code(201).send(guardianSerializer.parse(created));
}

export async function getGuardianView(request: FastifyRequest, reply: FastifyReply) {
  const id = readId(request, reply);
  if (!id) return;
  const profile = await prisma.guardianProfile.findUnique({ where: { id }, include: profileInclude });
  if (!profile) return reply.code(404).send({ error: 'Guardian not found' });
  return guardianSerializer.parse(profile);
}

export async function updateGuardianView(request: FastifyRequest, reply: FastifyReply) {
  const id = readId(request, reply);
  if (!id) return;
  const input = guardianUpdateSchema.safeParse(request.body);
  if (!input.success) return invalidInput(reply, input.error.flatten());
  const profile = await prisma.guardianProfile.update({ where: { id }, data: input.data, include: profileInclude });
  return guardianSerializer.parse(profile);
}

export async function deactivateGuardianView(request: FastifyRequest, reply: FastifyReply) {
  const id = readId(request, reply);
  if (!id) return;
  const profile = await prisma.guardianProfile.findUnique({ where: { id }, select: { userId: true } });
  if (!profile) return reply.code(404).send({ error: 'Guardian not found' });
  await prisma.user.update({ where: { id: profile.userId }, data: { isActive: false } });
  return reply.code(204).send();
}

function childScopeWhere(request: FastifyRequest): Prisma.ChildWhereInput {
  if (request.user.role === 'STAFF') {
    return { staffAssignments: { some: { staffProfile: { userId: request.user.sub }, endsAt: null } } };
  }
  if (request.user.role === 'GUARDIAN') {
    return { guardians: { some: { guardian: { userId: request.user.sub } } } };
  }
  return {};
}

export async function listChildrenView(request: FastifyRequest, reply: FastifyReply) {
  const children = await prisma.child.findMany({ where: childScopeWhere(request) });
  return children.map((child) => childSerializer.parse(child));
}

export async function getChildView(request: FastifyRequest, reply: FastifyReply) {
  const id = readId(request, reply);
  if (!id) return;
  const child = await prisma.child.findFirst({ where: { AND: [{ id }, childScopeWhere(request)] } });
  if (!child) return reply.code(404).send({ error: 'Child not found' });
  return childSerializer.parse(child);
}

export async function createChildView(request: FastifyRequest, reply: FastifyReply) {
  const input = childCreateSchema.safeParse(request.body);
  if (!input.success) return invalidInput(reply, input.error.flatten());
  const child = await prisma.child.create({ data: input.data });
  return reply.code(201).send(childSerializer.parse(child));
}

export async function updateChildView(request: FastifyRequest, reply: FastifyReply) {
  const id = readId(request, reply);
  if (!id) return;
  const input = childUpdateSchema.safeParse(request.body);
  if (!input.success) return invalidInput(reply, input.error.flatten());
  const child = await prisma.child.update({ where: { id }, data: input.data });
  return childSerializer.parse(child);
}

export async function archiveChildView(request: FastifyRequest, reply: FastifyReply) {
  const id = readId(request, reply);
  if (!id) return;
  const child = await prisma.child.update({ where: { id }, data: { isActive: false } });
  return childSerializer.parse(child);
}

export async function createChildGuardianView(request: FastifyRequest, reply: FastifyReply) {
  const input = childGuardianCreateSchema.safeParse(request.body);
  if (!input.success) return invalidInput(reply, input.error.flatten());
  const relation = await prisma.childGuardian.create({ data: input.data });
  return reply.code(201).send(childGuardianSerializer.parse(relation));
}

export async function listChildGuardiansView() {
  const relations = await prisma.childGuardian.findMany();
  return relations.map((relation) => childGuardianSerializer.parse(relation));
}

export async function deleteChildGuardianView(request: FastifyRequest, reply: FastifyReply) {
  const input = childGuardianParamsSchema.safeParse(request.params);
  if (!input.success) return invalidInput(reply, input.error.flatten());
  await prisma.childGuardian.delete({
    where: { childId_guardianId: input.data },
  });
  return reply.code(204).send();
}

export async function createStaffAssignmentView(request: FastifyRequest, reply: FastifyReply) {
  const input = staffAssignmentCreateSchema.safeParse(request.body);
  if (!input.success) return invalidInput(reply, input.error.flatten());
  const assignment = await prisma.staffAssignment.create({ data: input.data });
  return reply.code(201).send(staffAssignmentSerializer.parse(assignment));
}

export async function listStaffAssignmentsView() {
  const assignments = await prisma.staffAssignment.findMany();
  return assignments.map((assignment) => staffAssignmentSerializer.parse(assignment));
}

export async function endStaffAssignmentView(request: FastifyRequest, reply: FastifyReply) {
  const id = readId(request, reply);
  if (!id) return;
  const assignment = await prisma.staffAssignment.findUnique({ where: { id } });
  if (!assignment) return reply.code(404).send({ error: 'Staff assignment not found' });
  if (assignment.endsAt) return reply.code(409).send({ error: 'Staff assignment has already ended' });
  const ended = await prisma.staffAssignment.update({ where: { id }, data: { endsAt: new Date() } });
  return staffAssignmentSerializer.parse(ended);
}

export async function currentUserView(request: FastifyRequest) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: request.user.sub },
    select: publicUserSelect,
  });
  return publicUserSchema.parse(user);
}