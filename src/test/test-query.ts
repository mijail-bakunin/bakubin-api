import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const { PrismaClient } = require("@prisma/client");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ["query", "info", "warn", "error"],
});

async function run() {
  try {
    console.log("create");
    const u = await prisma.user.create({
      data: {
        name: "test",
        email: "test@example.com",
        passwordHash: "x",
      },
    });

    console.log("findUnique");
    const u2 = await prisma.user.findUnique({ where: { email: u.email } });
    await prisma.auditLog.create({
        data: {
            event: "USER_REGISTERED",
        details: "test entry"
        }
    })
    console.log("delete");
    await prisma.user.delete({ where: { id: u.id } });

    console.log("OK", u2);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run().catch(console.error);