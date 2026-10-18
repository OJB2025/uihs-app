import 'dotenv/config';
import argon2 from 'argon2';
import { PrismaClient, UserRole } from '@prisma/client';
import { z } from 'zod';

const seedEnvironment = z.object({
  INITIAL_ADMIN_USERNAME: z.string().min(3).max(32).regex(/^[a-zA-Z0-9._-]+$/).transform((value) => value.toLowerCase()),
  INITIAL_ADMIN_EMAIL: z.string().email().optional(),
  INITIAL_ADMIN_PASSWORD: z.string().min(12).max(128),
}).parse(process.env);

const prisma = new PrismaClient();

try {
  await prisma.user.upsert({
    where: { username: seedEnvironment.INITIAL_ADMIN_USERNAME },
    update: {},
    create: {
      username: seedEnvironment.INITIAL_ADMIN_USERNAME,
      email: seedEnvironment.INITIAL_ADMIN_EMAIL,
      passwordHash: await argon2.hash(seedEnvironment.INITIAL_ADMIN_PASSWORD),
      role: UserRole.ADMIN,
    },
  });
} finally {
  await prisma.$disconnect();
}