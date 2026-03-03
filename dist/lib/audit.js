"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = logAudit;
const prisma_1 = require("./prisma");
async function logAudit(opts) {
    const { event, userId, details, ip, userAgent } = opts;
    await prisma_1.prisma.auditLog.create({
        data: {
            event,
            userId: userId ?? undefined,
            details,
            ip: ip ?? undefined,
            userAgent: userAgent ?? undefined,
        },
    });
}
