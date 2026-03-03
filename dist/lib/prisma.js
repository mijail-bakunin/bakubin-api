"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const globalForPrisma = globalThis;
const pool = globalForPrisma.pool ??
    new pg_1.Pool({
        connectionString: process.env.DATABASE_URL,
    });
/* REVISAR ESTO MAS ADELANTE
pool.on("error", (err) => {
  console.error("Unexpected PG pool error", err);
});
*/
const adapter = new adapter_pg_1.PrismaPg(pool);
exports.prisma = globalForPrisma.prisma ??
    new client_1.PrismaClient({
        adapter,
        log: ["warn", "error"],
    });
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = exports.prisma;
    globalForPrisma.pool = pool;
}
