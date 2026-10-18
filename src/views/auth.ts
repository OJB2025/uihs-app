import argon2 from 'argon2';
import { AccountApprovalStatus } from '@prisma/client';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { guardianRegistrationSchema, loginSchema } from '../schemas/entities.js';
import { guardianSerializer } from '../serializers/entities.js';

type LoginRole = 'ADMIN' | 'STAFF' | 'GUARDIAN';

export function createRoleLoginView(expectedRole: LoginRole) {
  return async function roleLoginView(request: FastifyRequest, reply: FastifyReply) {
    const input = loginSchema.safeParse(request.body);
    if (!input.success) {
      return reply.code(400).send({ error: 'Invalid login', details: input.error.flatten() });
    }

    const user = await prisma.user.findUnique({ where: { username: input.data.username } });
    if (
      !user?.isActive ||
      user.approvalStatus !== AccountApprovalStatus.APPROVED ||
      user.role !== expectedRole ||
      !(await argon2.verify(user.passwordHash, input.data.password))
    ) {
      return reply.code(401).send({ error: 'Invalid username or password' });
    }

    const accessToken = await reply.jwtSign({ sub: user.id, role: user.role }, { expiresIn: '15m' });
    try {
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          method: request.method,
          route: request.routeOptions.url ?? `/api/auth/${expectedRole.toLowerCase()}/login`,
          statusCode: 200,
        },
      });
    } catch (error) {
      request.log.error({ err: error }, 'Failed to write login audit entry');
    }
    return { accessToken, tokenType: 'Bearer' };
  };
}

export async function registerGuardianView(request: FastifyRequest, reply: FastifyReply) {
  const input = guardianRegistrationSchema.safeParse(request.body);
  if (!input.success) {
    return reply.code(400).send({ error: 'Invalid profile', details: input.error.flatten() });
  }

  const { username, email, password, firstName, lastName } = input.data;
  const profile = await prisma.guardianProfile.create({
    data: {
      firstName,
      lastName,
      user: {
        create: {
          username,
          email,
          passwordHash: await argon2.hash(password),
          role: 'GUARDIAN',
          isActive: false,
          approvalStatus: AccountApprovalStatus.PENDING,
        },
      },
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  return reply.code(201).send({
    profile: guardianSerializer.parse(profile),
    approvalStatus: AccountApprovalStatus.PENDING,
  });
}