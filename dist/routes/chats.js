"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const currentUser_1 = require("../middleware/currentUser");
const router = (0, express_1.Router)();
router.use(currentUser_1.currentUser);
router.post("/", async (req, res) => {
    const user = req.user;
    const { title } = req.body;
    const chat = await prisma_1.prisma.chat.create({
        data: {
            userId: user.id,
            title: typeof title === "string" && title.trim() ? title.trim() : undefined,
        },
    });
    return res.status(201).json({
        ok: true,
        chat,
    });
});
router.get("/", async (req, res) => {
    const user = req.user;
    const chats = await prisma_1.prisma.chat.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
        select: {
            id: true,
            title: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    return res.json({
        ok: true,
        items: chats,
    });
});
router.get("/:chatId/messages", async (req, res) => {
    const user = req.user;
    const { chatId } = req.params;
    const chat = await prisma_1.prisma.chat.findFirst({
        where: {
            id: chatId,
            userId: user.id,
        },
    });
    if (!chat) {
        return res.status(404).json({
            ok: false,
            message: "Chat no encontrado",
        });
    }
    const messages = await prisma_1.prisma.message.findMany({
        where: { chatId },
        orderBy: { createdAt: "asc" },
        include: { attachments: true },
    });
    return res.json({
        ok: true,
        items: messages,
    });
});
router.post("/:chatId/messages", async (req, res) => {
    const user = req.user;
    const { chatId } = req.params;
    const { content } = req.body;
    if (!content || typeof content !== "string") {
        return res.status(400).json({
            ok: false,
            message: "Contenido inválido",
        });
    }
    const chat = await prisma_1.prisma.chat.findFirst({
        where: { id: chatId, userId: user.id },
    });
    if (!chat) {
        return res.status(404).json({
            ok: false,
            message: "Chat no encontrado",
        });
    }
    const message = await prisma_1.prisma.message.create({
        data: {
            chatId,
            role: "user",
            content,
        },
    });
    // ⚠️ opcional pero recomendado
    await prisma_1.prisma.chat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() },
    });
    return res.status(201).json({
        ok: true,
        messages: [message], // lista para LLM
    });
});
exports.default = router;
