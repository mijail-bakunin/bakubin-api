import { Router } from "express";
import { prisma } from "../lib/prisma";
import { hashPassword, verifyPassword } from "../lib/password";
import { getClientInfo } from "../lib/http";
import { logAudit } from "../lib/audit";
import { RegisterSchema, LoginSchema } from "../lib/schemas/auth.schema";

const router = Router();

router.use((req, _res, next) => {
  console.log("Auth router recibió:", req.method, req.url);
  next();
});

/** - REGISTER:
 * POST /auth/register
 * Body: { name, email, password,  role}
 */

router.post("/register", async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      errors: parsed.error.flatten(),
    });
  }

  const { name, email, password, role } = parsed.data;
  const { ip, userAgent } = getClientInfo(req);

  try {
    const normalizedEmail = email.toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      await logAudit({
        event: "USER_REGISTRATION_FAILED",
        userId: existing.id,
        details: "Intento de registro con email existente",
        ip,
        userAgent,
      });

      return res.status(409).json({
        ok: false,
        message: "Ya existe un usuario con ese correo.",
      });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role
      },
    });

    await logAudit({
      event: "USER_REGISTERED",
      userId: user.id,
      details: `Registro de usuario con rol ${role}`,
      ip,
      userAgent,
    });

    const { passwordHash: _, ...safeUser } = user;

    return res.status(201).json({
      ok: true,
      user: safeUser,
    });
  } catch (err: any) {
    await logAudit({
      event: "USER_REGISTRATION_FAILED",
      details: `Error inesperado: ${err?.message}`,
      ip,
      userAgent,
    });

    return res.status(500).json({
      ok: false,
      message: "Error interno al registrar usuario.",
    });
  }
});


/** - LOGIN:
 * POST /auth/login
 * Body: { email, password }
 */
router.post("/login", async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      errors: parsed.error.flatten(),
    });
  }

  const { email, password } = parsed.data;
  const { ip, userAgent } = getClientInfo(req);

  try {
    const normalizedEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      await logAudit({
        event: "USER_LOGIN_FAILED",
        details: "Email no encontrado",
        ip,
        userAgent,
      });

      return res.status(401).json({
        ok: false,
        message: "Credenciales inválidas.",
      });
    }

    const valid = await verifyPassword(user.passwordHash, password);

    if (!valid) {
      await logAudit({
        event: "USER_LOGIN_FAILED",
        userId: user.id,
        details: "Password incorrecto",
        ip,
        userAgent,
      });

      return res.status(401).json({
        ok: false,
        message: "Credenciales inválidas.",
      });
    }

    await logAudit({
      event: "USER_LOGIN_SUCCESS",
      userId: user.id,
      ip,
      userAgent,
    });

    const { passwordHash: _, ...safeUser } = user;

    return res.status(200).json({
      ok: true,
      user: safeUser,
    });
  } catch {
    return res.status(500).json({
      ok: false,
      message: "Error interno en login.",
    });
  }
});

export default router;
