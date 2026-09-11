import { PrismaClient, Prisma, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

export async function createUser(data: {
  email: string;
  passwordHash: string;
  role: UserRole;
}) {
  return prisma.user.create({ data });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function updateUser(id: string, data: Prisma.UserUpdateInput) {
  return prisma.user.update({ where: { id }, data });
}

export async function findUserByResetToken(token: string) {
  return prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetTokenExpiry: { gt: new Date() },
    },
  });
}
