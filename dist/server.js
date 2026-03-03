"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = __importDefault(require("./routes/auth"));
const chats_1 = __importDefault(require("./routes/chats"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "bakubin-api" });
});
app.use("/auth", auth_1.default);
app.use("/chats", chats_1.default);
app.use((_req, res) => {
    res.status(404).json({
        ok: false,
        message: "Ruta no encontrada",
    });
});
app.use((err, _req, res, _next) => {
    console.error("Error no manejado:", err);
    res.status(500).json({
        ok: false,
        message: "Error interno del servidor",
    });
});
const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => {
    console.log(`Bakubin API escuchando en http://localhost:${PORT}`);
});
