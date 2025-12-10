// src/lib/emailVerification.ts
import { prisma } from "./prisma";
import crypto from "crypto";

const VERIFICATION_WINDOW_HOURS = 24;

export async function createEmailVerificationToken(email: string) {
  const token = crypto.randomUUID();

  const expires = new Date();
  expires.setHours(expires.getHours() + VERIFICATION_WINDOW_HOURS);

  const record = await prisma.verificationToken.create({
    data: {
      identifier: email.toLowerCase(),
      token,
      expires,
    },
  });

  return record;
}

export async function consumeVerificationToken(token: string) {
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!record) return null;

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return null;
  }

  await prisma.verificationToken.delete({ where: { token } });

  return record;
}
