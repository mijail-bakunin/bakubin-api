"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEmailVerificationToken = createEmailVerificationToken;
exports.consumeVerificationToken = consumeVerificationToken;
const prisma_1 = require("./prisma");
const crypto_1 = __importDefault(require("crypto"));
const VERIFICATION_WINDOW_HOURS = 24;
async function createEmailVerificationToken(email) {
    const token = crypto_1.default.randomUUID();
    const expires = new Date();
    expires.setHours(expires.getHours() + VERIFICATION_WINDOW_HOURS);
    const record = await prisma_1.prisma.verificationToken.create({
        data: {
            identifier: email.toLowerCase(),
            token,
            expires,
        },
    });
    return record;
}
async function consumeVerificationToken(token) {
    const record = await prisma_1.prisma.verificationToken.findUnique({
        where: { token },
    });
    if (!record)
        return null;
    if (record.expires < new Date()) {
        await prisma_1.prisma.verificationToken.delete({ where: { token } });
        return null;
    }
    await prisma_1.prisma.verificationToken.delete({ where: { token } });
    return record;
}
