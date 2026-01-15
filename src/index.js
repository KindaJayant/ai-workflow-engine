import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

import { askPrompt } from "./prompts/ask.v1.js";
import { validateLLMResponse } from "./utils/validateResponse.js";
import { jobsRouter } from "./routes/jobs.js";

import { retrieveRelevantChunks } from "./rag/retriever.js";
import { ragPrompt } from "./rag/prompt.js";

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

  if (!question || typeof question !== "string") {
    return res.status(400).json({
      error: "Invalid request",
      message: "Field 'question' must be a non-empty string",
    });
  }

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

  let parsed;
  try {
    parsed = JSON.parse(completion.choices[0].message.content);
  } catch {
    return res.status(500).json({
      error: "Invalid JSON returned by LLM",
    });
  }

  if (!validateLLMResponse(parsed)) {
    return res.status(500).json({
      error: "LLM response failed schema validation",
    });
  }

  return res.json({
    answer: parsed.answer,
    confidence: parsed.confidence,
  });
});

/**
 * RAG endpoint (Day 4)
 */
app.post("/rag", async (req, res) => {
  const { question } = req.body;

  if (!question || typeof question !== "string") {
    return res.status(400).json({
      error: "Invalid request",
      message: "Field 'question' must be a non-empty string",
    });
  }

  // Retrieve relevant chunks
  const chunks = retrieveRelevantChunks(question);

  // No relevant data → no hallucination
  if (chunks.length === 0) {
    return res.json({
      answer: "I don't know",
      sources: [],
    });
  }

  // LLM not configured (still show retrieval worked)
  if (!client) {
    return res.status(503).json({
      error: "LLM provider not configured",
      retrievedContext: chunks.map(c => c.docId),
    });
  }

  let completion;
  try {
    completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: ragPrompt(question, chunks),
      temperature: 0,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to call LLM provider",
      details: err.message,
    });
  }

  let parsed;
  try {
    parsed = JSON.parse(completion.choices[0].message.content);
  } catch {
    return res.status(500).json({
      error: "Invalid JSON returned by LLM",
    });
  }

  return res.json(parsed);
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
