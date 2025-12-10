import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Import usando require para evitar problemas de tipos
const { PrismaClient } = require("@prisma/client");

type PrismaClientType = any; // Usa any temporalmente para evitar errores de tipos

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClientType;
  pool?: Pool;
};

// Crear el pool de conexiones de PostgreSQL
const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

// Crear el adaptador
const adapter = new PrismaPg(pool);

// Crear el cliente de Prisma con el adaptador
export const prisma: PrismaClientType =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}