"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.currentUser = currentUser;
const prisma_1 = require("../lib/prisma");
async function currentUser(req, res, next) {
    const userId = req.header("x-user-id");
    if (!userId) {
        return res.status(401).json({
            ok: false,
            message: "Falta x-user-id (auth no implementada aún)",
        });
    }
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        return res.status(401).json({
            ok: false,
            message: "Usuario inválido",
        });
    }
    req.user = user;
    next();
}
