import "dotenv/config";
import express from "express";
import cors from "cors";
import {prisma } from "./db.js";
import {z} from "zod";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

// CORS: allow the web app in dev
const allowedOrigins = [process.env.WEB_ORIGIN ?? "http://localhost:3000"];
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Optional: friendly root
app.get("/", (_req, res) => {
  res.send('Fitness API up. Try GET /health');
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "fitness-app-api", time: new Date().toISOString() });
});
// list users
app.get("/users", async (_req, res) => {
  const users = await prisma.user.findMany({ include: { profile: true } });
  res.json(users);
});

// create a user
app.post("/users", async (req, res) => {
  const Body = z.object({ email: z.string().email(), name: z.string().optional() });
  const parsed = Body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());

  const { email, name } = parsed.data;
  const user = await prisma.user.create({
    data: { email, profile: name ? { create: { name } } : undefined },
    include: { profile: true },
  });
  res.status(201).json(user);
});

// Optional: JSON 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: "Not Found", path: req.path });
});

app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
