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


/*
export function getClientInfo(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];
  const ip =
    typeof forwarded === "string"
      ? forwarded.split(",")[0].trim()
      : typeof req.headers["x-real-ip"] === "string"
      ? req.headers["x-real-ip"]
      : req.socket.remoteAddress ?? null;

  const userAgent =
    typeof req.headers["user-agent"] === "string"
      ? req.headers["user-agent"]
      : null;

  return { ip, userAgent };
}
*/