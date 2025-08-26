import "dotenv/config";
import express from "express";
import { handleDemo } from "./routes/demo";
import { handleTokens } from "./routes/tokens";

export function createServer() {
  const app = express();
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  
  // Tokens endpoint for Figma plugin
  app.get("/api/tokens", handleTokens);

  return app;
}
