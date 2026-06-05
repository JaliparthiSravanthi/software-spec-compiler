import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { compileAppRequirements } from "./server/compiler";
import dotenv from "dotenv";

dotenv.config();

// Port & Host bind requirements
const PORT = 3000;
const HOST = "0.0.0.0";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function bootstrap() {
  const app = express();
  app.use(express.json());

  // 1. Compile endpoint triggers our Multi-Stage repair compiler
  app.post("/api/compile", async (req: Request, res: Response) => {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") {
      res.status(400).json({ error: "A valid 'prompt' string is required in request body." });
      return;
    }

    try {
      console.log(`Starting software compiling for prompt: "${prompt.slice(0, 60)}..."`);
      const result = await compileAppRequirements(prompt);
      res.json(result);
    } catch (err: any) {
      console.error("Compilation failed critically:", err);
      res.status(500).json({ 
        error: "Compilation engine aborted due to an internal server error.", 
        details: err.message 
      });
    }
  });

  // 2. Health check endpoint
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({ status: "alive", timestamp: new Date().toISOString() });
  });

  // 3. Vite middleware setup based on NODE_ENV environment mode
  if (process.env.NODE_ENV !== "production") {
    console.log("Hooking Vite middleware for Development Mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Configuring Static Index serving for Production Mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || "development"} mode.`);
    console.log(`Host address: http://${HOST}:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to bootstrap server container:", err);
  process.exit(1);
});
