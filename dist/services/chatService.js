"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatService = void 0;
const prisma_1 = require("../lib/prisma");
exports.chatService = {
    // Crear un nuevo chat
    async createChat(userId, title = 'Nuevo chat') {
        return await prisma_1.prisma.chat.create({
            data: {
                userId,
                title,
            },
        });
    },
    async getUserChats(userId) {
        return await prisma_1.prisma.chat.findMany({
            where: { userId },
            include: {
                messages: {
                    include: {
                        attachments: true,
                    },
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });
    },
    // Obtener chats sin mensajes (para sidebar)
    async getUserChatsPreview(userId) {
        return await prisma_1.prisma.chat.findMany({
            where: { userId },
            orderBy: {
                updatedAt: 'desc',
            },
        });
    },
    // Obtener un chat específico con sus mensajes
    async getChatById(chatId, userId) {
        return await prisma_1.prisma.chat.findFirst({
            where: {
                id: chatId,
                userId, // Asegura que el chat pertenece al usuario
            },
            include: {
                messages: {
                    include: {
                        attachments: true,
                    },
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
            },
        });
    },
    // Agregar un mensaje a un chat
    async addMessage(chatId, role, content) {
        // Prisma hace el update del updatedAt automáticamente por el @updatedAt
        return await prisma_1.prisma.message.create({
            data: {
                chatId,
                role,
                content,
            },
        });
    },
    // Agregar mensaje con attachments
    async addMessageWithAttachments(chatId, role, content, attachments) {
        return await prisma_1.prisma.message.create({
            data: {
                chatId,
                role,
                content,
                attachments: {
                    create: attachments,
                },
            },
            include: {
                attachments: true,
            },
        });
    },
    // Actualizar título de chat
    async updateChatTitle(chatId, userId, title) {
        try {
            return await prisma_1.prisma.chat.update({
                where: {
                    id: chatId,
                    userId, // Verifica que pertenece al usuario
                },
                data: {
                    title,
                },
            });
        }
        catch (error) {
            // Si no encuentra el chat, retorna null
            return null;
        }
    },
    // Eliminar un chat
    async deleteChat(chatId, userId) {
        try {
            await prisma_1.prisma.chat.delete({
                where: {
                    id: chatId,
                    userId, // Verifica que pertenece al usuario
                },
            });
            return true;
        }
        catch (error) {
            return false;
        }
    },
    // Buscar chats por título
    async searchChats(userId, query) {
        return await prisma_1.prisma.chat.findMany({
            where: {
                userId,
                title: {
                    contains: query,
                    mode: 'insensitive', // Case insensitive
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });
    },
    // Obtener mensajes de un chat (útil para paginación futura)
    async getChatMessages(chatId, userId, limit = 50, offset = 0) {
        // Primero verifica que el chat pertenece al usuario
        const chat = await prisma_1.prisma.chat.findFirst({
            where: { id: chatId, userId },
        });
        if (!chat)
            return [];
        return await prisma_1.prisma.message.findMany({
            where: { chatId },
            include: {
                attachments: true,
            },
            orderBy: {
                createdAt: 'asc',
            },
            take: limit,
            skip: offset,
        });
    },
    // Contar mensajes de un chat
    async countChatMessages(chatId) {
        return await prisma_1.prisma.message.count({
            where: { chatId },
        });
    },
};
