import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

async function main() {
  console.log("Creando PrismaClient...");

  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL no está definida");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);

  const prisma = new PrismaClient({
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