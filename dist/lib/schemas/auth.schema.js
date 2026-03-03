"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginSchema = exports.RegisterSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
/**
 * Registro de usuario (backend)
 */
exports.RegisterSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "El nombre es obligatorio"),
    email: zod_1.z.string().email("Email inválido"),
    password: zod_1.z
        .string()
        .min(8, "La contraseña debe tener al menos 8 caracteres"),
    role: zod_1.z.nativeEnum(client_1.UserRole),
});
/**
 * Login
 */
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Email inválido"),
    password: zod_1.z.string().min(1, "La contraseña es obligatoria"),
});
