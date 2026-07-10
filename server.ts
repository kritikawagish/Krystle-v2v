import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { analyzeThreat, dispatchAlert } from "./api/lib/threat-engine";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// REST APIs
// NOTE: The actual business logic lives in api/lib/threat-engine.ts so that
// this local Express server and the Vercel serverless functions in /api
// (used in production) always stay perfectly in sync.

// 1. Environmental Threat AI Analyzer
app.post("/api/analyze-threat", async (req, res) => {
  const { transcript, audioSnippetLengthSec, simulatedAudio } = req.body;

  if (!transcript) {
    return res.status(400).json({ error: "No vocal transcript or vocal indicator provided for analysis." });
  }

  try {
    const result = await analyzeThreat(transcript, audioSnippetLengthSec, simulatedAudio);
    res.json(result);
  } catch (err) {
    console.error("analyze-threat error:", err);
    res.status(500).json({ success: false, error: "Internal threat analysis error." });
  }
});

// 2. Emergency SOS Dispatcher
app.post("/api/trigger-alert", (req, res) => {
  const { contacts, location, triggerMethod, timestamp } = req.body;
  try {
    const result = dispatchAlert(contacts, location, triggerMethod, timestamp);
    res.json(result);
  } catch (err) {
    console.error("trigger-alert error:", err);
    res.status(500).json({ success: false, error: "Internal SOS dispatch error." });
  }
});

// Vite & Static Asset Handling
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GuardianHalo IoT Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
