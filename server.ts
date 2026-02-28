import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, "data.json");
const TEMPLATE_FILE = path.join(__dirname, "data.template.json");

async function ensureDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    try {
      const template = await fs.readFile(TEMPLATE_FILE, "utf-8");
      await fs.writeFile(DATA_FILE, template, "utf-8");
      console.log("Initialized data.json from template.");
    } catch (err) {
      console.error("Failed to initialize data.json:", err);
      // Fallback to minimal data if template is also missing
      const minimalData = { config: { name: "Suivi de Chantier", subtitle: "", steps: [] }, tasks: [] };
      await fs.writeFile(DATA_FILE, JSON.stringify(minimalData), "utf-8");
    }
  }
}

async function startServer() {
  await ensureDataFile();
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/data", async (req, res) => {
    try {
      const data = await fs.readFile(DATA_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (error) {
      console.error("Error reading data file:", error);
      res.status(500).json({ error: "Failed to read data" });
    }
  });

  app.post("/api/data", async (req, res) => {
    try {
      const newData = req.body;
      await fs.writeFile(DATA_FILE, JSON.stringify(newData, null, 2), "utf-8");
      res.json({ success: true });
    } catch (error) {
      console.error("Error writing data file:", error);
      res.status(500).json({ error: "Failed to save data" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  }).on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Please stop the other process or wait a few seconds.`);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer();
