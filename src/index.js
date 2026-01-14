import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

import { askPrompt } from "./prompts/ask.v1.js";
import { validateLLMResponse } from "./utils/validateResponse.js";
import { jobsRouter } from "./routes/jobs.js";

dotenv.config();

const app = express();
app.use(express.json());

// Initialize OpenAI client only if API key exists
let client = null;
if (process.env.OPENAI_API_KEY) {
  client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * Health check
 */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/**
 * Synchronous ask endpoint (Day 2)
 */
app.post("/ask", async (req, res) => {
  const { question } = req.body;

  // Input validation
  if (!question || typeof question !== "string") {
    return res.status(400).json({
      error: "Invalid request",
      message: "Field 'question' must be a non-empty string",
    });
  }

  // LLM not configured
  if (!client) {
    return res.status(503).json({
      error: "LLM provider not configured",
      hint: "Set OPENAI_API_KEY to enable responses",
    });
  }

  let completion;

  try {
    completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: askPrompt(question),
      temperature: 0.3,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to call LLM provider",
      details: err.message,
    });
  }

  // Safe JSON parsing
  let parsed;
  try {
    parsed = JSON.parse(
      completion.choices[0].message.content
    );
  } catch (err) {
    return res.status(500).json({
      error: "Invalid JSON returned by LLM",
    });
  }

  // Schema validation
  if (!validateLLMResponse(parsed)) {
    return res.status(500).json({
      error: "LLM response failed schema validation",
    });
  }

  // Stable response contract
  return res.json({
    answer: parsed.answer,
    confidence: parsed.confidence,
  });
});

/**
 * Asynchronous jobs endpoint (Day 3)
 */
app.use("/jobs", jobsRouter(client));

/**
 * Start server
 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
