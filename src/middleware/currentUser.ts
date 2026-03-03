import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

export async function currentUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const userId = req.header("x-user-id");

  if (!userId) {
    return res.status(401).json({
      ok: false,
      message: "Falta x-user-id (auth no implementada aún)",
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return res.status(401).json({
      ok: false,
      message: "Usuario inválido",
    });
  }

  (req as any).user = user;
  next();
}
