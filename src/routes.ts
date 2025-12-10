// src/routes/auth.ts
import { Router } from "express";
import { prisma } from "./lib/prisma";
import { hashPassword } from "./lib/password";
import { createEmailVerificationToken, consumeVerificationToken } from "./lib/emailVerification";
import { logAudit } from "./lib/audit";
import { getClientInfo } from "./lib/http";

const router = Router();

/**
 * POST /auth/register
 * Body: { name, email, password, confirmPassword? }
 */
router.post("/register", async (req, res) => {
  const { ip, userAgent } = getClientInfo(req);
  const { name, email, password, confirmPassword } = req.body ?? {};

  try {
    // Validaciones verborrágicas
    if (!email || typeof email !== "string") {
      return res.status(400).json({
        message:
          "Debes ingresar un correo electrónico válido. Este será tu usuario en Bakubin.",
      });
    }

    if (!password || typeof password !== "string") {
      return res.status(400).json({
        message:
          "Debes ingresar una contraseña. Sin contraseña no podemos proteger tu cuenta.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message:
          "La contraseña debe tener al menos 8 caracteres. Pensá en algo que puedas recordar, pero que no sea trivial.",
      });
    }

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        message:
          "Ingresa un nombre o alias para identificarte en Bakubin. Puede ser tu nombre real, un alias militante, o el rol que ocupás.",
      });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({
        message:
          "Las contraseñas no coinciden. Verificá que hayas escrito lo mismo en ambos campos.",
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
        details: "Intento de registro con un email ya utilizado.",
        ip,
        userAgent,
      });

      return res.status(409).json({
        message:
          "Ya existe una cuenta asociada a ese correo. Si no recordás la contraseña, más adelante vas a poder recuperarla.",
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
      details: "Registro inicial de usuario",
      ip,
      userAgent,
    });

    const tokenRecord = await createEmailVerificationToken(user.email);

    await logAudit({
      event: "EMAIL_VERIFICATION_SENT",
      userId: user.id,
      details: `Token ${tokenRecord.token}`,
      ip,
      userAgent,
    });

    const baseUrl =
      process.env.FRONTEND_BASE_URL ?? "http://localhost:3000";

    const verifyUrl = `${baseUrl}/auth/verify-email?token=${tokenRecord.token}`;

    // Aquí, en un sistema real, enviarías un mail con verifyUrl.
    // Por ahora, lo devolvemos para poder probarlo rápido.
    return res.status(201).json({
      ok: true,
      message:
        "Te registraste correctamente. Te enviamos (en esta respuesta, por ahora) un enlace para verificar tu correo.",
      debugVerificationUrl: verifyUrl,
    });
  } catch (err: any) {
    await logAudit({
      event: "USER_REGISTRATION_FAILED",
      details: `Error inesperado: ${err?.message ?? String(err)}`,
      ip,
      userAgent,
    });

    return res.status(500).json({
      message:
        "Ocurrió un error inesperado al registrar tu cuenta. Probá de nuevo en unos minutos.",
    });
  }
});

/**
 * GET /auth/verify-email?token=...
 */
router.get("/verify-email", async (req, res) => {
  const token = req.query.token as string | undefined;

  if (!token) {
    return res.status(400).json({
      message:
        "Falta el token de verificación. Asegurate de usar el enlace completo que te enviamos.",
    });
  }

  try {
    const tokenRecord = await consumeVerificationToken(token);
    if (!tokenRecord) {
      return res.status(400).json({
        message:
          "El enlace de verificación no es válido o ya fue utilizado. Si necesitás otro, pedí que te reenviemos el correo.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: tokenRecord.identifier },
    });

    if (!user) {
      return res.status(404).json({
        message:
          "No se encontró el usuario asociado a este enlace. Es posible que la cuenta haya sido eliminada.",
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });

    await logAudit({
      event: "EMAIL_VERIFIED",
      userId: user.id,
      details: "El usuario confirmó su correo electrónico.",
      ip: null,
      userAgent: null,
    });

    // Más adelante: redirigir al frontend + auto-login
    // Por ahora, respondemos JSON “limpio”
    return res.status(200).json({
      ok: true,
      message: "Tu correo fue verificado correctamente. Ya podés iniciar sesión.",
    });
  } catch (err: any) {
    return res.status(500).json({
      message:
        "Ocurrió un error al verificar el correo. Si el problema persiste, solicitá un nuevo enlace.",
    });
  }
});

export default router;
