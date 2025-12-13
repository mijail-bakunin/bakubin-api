import { z } from "zod";
import { UserRole } from "@prisma/client";

/**
 * Registro de usuario (backend)
 */
export const RegisterSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres"),
  role: z.nativeEnum(UserRole),
});

/**
 * Login
 */
export const LoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
