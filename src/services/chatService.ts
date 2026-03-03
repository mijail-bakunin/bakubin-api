import { prisma } from "../lib/prisma";
import { Chat, Message, Attachment } from '@prisma/client';

export type ChatWithMessages = Chat & {
  messages: (Message & {
    attachments: Attachment[];
  })[];
};

export const chatService = {
  // Crear un nuevo chat
  async createChat(userId: string, title: string = 'Nuevo chat'): Promise<Chat> {
    return await prisma.chat.create({
      data: {
        userId,
        title,
      },
    });
  },

  async getUserChats(userId: string): Promise<ChatWithMessages[]> {
    return await prisma.chat.findMany({
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
  async getUserChatsPreview(userId: string): Promise<Chat[]> {
    return await prisma.chat.findMany({
      where: { userId },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  },

  // Obtener un chat específico con sus mensajes
  async getChatById(chatId: string, userId: string): Promise<ChatWithMessages | null> {
    return await prisma.chat.findFirst({
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
  async addMessage(
    chatId: string,
    role: 'user' | 'assistant' | 'system',
    content: string
  ): Promise<Message> {
    // Prisma hace el update del updatedAt automáticamente por el @updatedAt
    return await prisma.message.create({
      data: {
        chatId,
        role,
        content,
      },
    });
  },

  // Agregar mensaje con attachments
  async addMessageWithAttachments(
    chatId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    attachments: {
      filename: string;
      originalFilename: string;
      mimeType: string;
      sizeBytes: number;
      storagePath: string;
    }[]
  ): Promise<Message> {
    return await prisma.message.create({
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
  async updateChatTitle(chatId: string, userId: string, title: string): Promise<Chat | null> {
    try {
      return await prisma.chat.update({
        where: {
          id: chatId,
          userId, // Verifica que pertenece al usuario
        },
        data: {
          title,
        },
      });
    } catch (error) {
      // Si no encuentra el chat, retorna null
      return null;
    }
  },

  // Eliminar un chat
  async deleteChat(chatId: string, userId: string): Promise<boolean> {
    try {
      await prisma.chat.delete({
        where: {
          id: chatId,
          userId, // Verifica que pertenece al usuario
        },
      });
      return true;
    } catch (error) {
      return false;
    }
  },

  // Buscar chats por título
  async searchChats(userId: string, query: string): Promise<Chat[]> {
    return await prisma.chat.findMany({
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
  async getChatMessages(
    chatId: string,
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Message[]> {
    // Primero verifica que el chat pertenece al usuario
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId },
    });

    if (!chat) return [];

    return await prisma.message.findMany({
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
  async countChatMessages(chatId: string): Promise<number> {
    return await prisma.message.count({
      where: { chatId },
    });
  },
};