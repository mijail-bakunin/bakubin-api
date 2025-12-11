import { Request } from "express";

export function getClientInfo(req: Request) {
  const ip =
    (req.headers["x-forwarded-for"] as string) ??
    (req.headers["x-real-ip"] as string) ??
    req.socket.remoteAddress ??
    null;

  const userAgent = (req.headers["user-agent"] as string) ?? null;

  return { ip, userAgent };
}
