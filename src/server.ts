import "dotenv/config";
import express from "express";
import cors from "cors";
import authRouter from "./routes/auth";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Healthcheck
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "bakubin-api" });
});

// Rutas de autenticación
console.log("Montando rutas de autenticación...");
app.use("/auth", authRouter);
console.log("Rutas de autenticación montadas.");

// Manejo de rutas no encontradas
app.use((_req, res) => {
  res.status(404).json({
    ok: false,
    message: "Ruta no encontrada",
  });
});

// Manejo de errores global
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
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