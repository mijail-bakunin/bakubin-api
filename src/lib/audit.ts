import { prisma } from "./prisma";

export type AuditEvent =
  | "USER_REGISTERED"
  | "USER_LOGIN_SUCCESS"
  | "USER_LOGIN_FAILED"
  | "PASSWORD_RESET_REQUESTED"
  | "PASSWORD_RESET_SUCCESS"
  | "EMAIL_VERIFICATION_SENT" 
  | "USER_REGISTRATION_FAILED"
  | "EMAIL_VERIFIED";

export async function logAudit(opts: {
  event: AuditEvent;
  userId?: string | null;
  details?: string;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const { event, userId, details, ip, userAgent } = opts;

  await prisma.auditLog.create({
    data: {
      event,
      userId: userId ?? undefined,
      details,
      ip: ip ?? undefined,
      userAgent: userAgent ?? undefined,
    },
  });
}
