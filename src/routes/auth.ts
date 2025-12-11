import { Router } from "express";
import { prisma } from "../lib/prisma";
import { hashPassword, verifyPassword } from "../lib/password";
import { getClientInfo } from "../lib/http";
import { logAudit } from "../lib/audit";

const router = Router();

router.use((req, _res, next) => {
  console.log("Auth router recibió:", req.method, req.url);
  next();
});

/** - REGISTER:
 * POST /auth/register
 * Body: { name, email, password, confirmPassword }
 */
router.post("/register", async (req, res) => {
  const { name, email, password, confirmPassword } = req.body ?? {};
  const { ip, userAgent } = getClientInfo(req);

  try {
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        ok: false,
        message:
          "Debes ingresar un nombre o alias para la cuenta.",
      });
    }

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        ok: false,
        message: "Debes ingresar un correo electrónico válido.",
      });
    }

    if (!password || typeof password !== "string") {
      return res.status(400).json({
        ok: false,
        message: "Debes ingresar una contraseña.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        ok: false,
        message: "La contraseña debe tener al menos 8 caracteres.",
      });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({
        ok: false,
        message: "Las contraseñas no coinciden.",
      });
    }

    const normalizedEmail = email.toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      await logAudit({
        event: "USER_REGISTRATION_FAILED",
        userId: existing.id,
        details: "Intento de registrarse con email existente",
        ip,
        userAgent,
      });

      return res.status(409).json({
        ok: false,
        message:
          "Ya existe un usuario con ese correo.",
      });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
      },
    });

    await logAudit({
      event: "USER_REGISTERED",
      userId: user.id,
      details: "Registro sin verificación de email aún",
      ip,
      userAgent,
    });

    const { passwordHash: _, ...safeUser } = user;

    return res.status(201).json({
      ok: true,
      message: "Usuario registrado correctamente.",
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
  const { email, password } = req.body ?? {};
  const { ip, userAgent } = getClientInfo(req);

  try {
    if (!email || typeof email !== "string") {
      return res.status(400).json({
        ok: false,
        message: "Debes ingresar un email.",
      });
    }

    if (!password || typeof password !== "string") {
      return res.status(400).json({
        ok: false,
        message: "Debes ingresar una contraseña.",
      });
    }

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
      details: "Login exitoso (sin tokens aún)",
      ip,
      userAgent,
    });

    const { passwordHash: _, ...safeUser } = user;

    return res.status(200).json({
      ok: true,
      message: "Login correcto.",
      user: safeUser,
    });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      message: "Error interno en login.",
    });
  }
});

export default router;
