import "dotenv/config";
import express from "express";
import cors from "cors";
import authRouter from "./routes/auth";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "bakubin-api" });
});

app.use("/auth", authRouter);

app.use((_req, res) => {
  res.status(404).json({
    ok: false,
    message: "Ruta no encontrada",
  });
});

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