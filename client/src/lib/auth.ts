import crypto from "crypto";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function hashPassword(password: string) {
  const rounds = 10;
  return bcrypt.hash(password, rounds);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function newSessionToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export async function createSession(userId: string, days = 7) {
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { token, userId, expiresAt } });
  return { token, expiresAt };
}

export async function getUserBySessionToken(token: string | undefined | null) {
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { token } });
    return null;
  }
  return session.user;
}

export async function revokeSession(token: string) {
  try {
    await prisma.session.delete({ where: { token } });
  } catch (error) {
    console.log(error);
  }
}
