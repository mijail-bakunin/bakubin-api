"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
async function main() {
    console.log("Creando PrismaClient...");
    if (!process.env.DATABASE_URL) {
        console.error("ERROR: DATABASE_URL no está definida");
        process.exit(1);
    }
    const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new adapter_pg_1.PrismaPg(pool);
    const prisma = new client_1.PrismaClient({
        adapter,
        log: ["query", "info", "warn", "error"],
    });
    console.log("Intentando conectar...");
    await prisma.$connect();
    console.log("Conectado OK ✓");
    const count = await prisma.user.count();
    console.log("Usuarios en la base:", count);
    await prisma.$disconnect();
    await pool.end();
}
main().catch((err) => {
    console.error("ERROR:", err);
});
