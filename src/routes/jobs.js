import express from "express";
import { createJob, getJob, updateJob } from "../jobs/jobStore.js";
import { askPrompt } from "../prompts/ask.v1.js";
import { validateLLMResponse } from "../utils/validateResponse.js";

const router = express.Router();

export const jobsRouter = (client) => {
  /**
   * Create job
   */
  router.post("/", async (req, res) => {
    const { question } = req.body;

    if (!question || typeof question !== "string") {
      return res.status(400).json({
        error: "Invalid request",
        message: "Field 'question' must be a non-empty string",
      });
    }

    const jobId = createJob({ question });

    // Run async job
    setImmediate(async () => {
      try {
        if (!client) {
          updateJob(jobId, {
            status: "failed",
            error: "LLM provider not configured",
          });
          return;
        }

        const completion = await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: askPrompt(question),
          temperature: 0.3,
        });

        const parsed = JSON.parse(
          completion.choices[0].message.content
        );

        if (!validateLLMResponse(parsed)) {
          throw new Error("Schema validation failed");
        }

        updateJob(jobId, {
          status: "completed",
          result: parsed,
        });
      } catch (err) {
        updateJob(jobId, {
          status: "failed",
          error: err.message,
        });
      }
    });

    // Respond immediately
    return res.status(202).json({
      jobId,
      status: "pending",
    });
  });

  /**
   * Get job status
   */
  router.get("/:id", (req, res) => {
    const job = getJob(req.params.id);

    if (!job) {
      return res.status(404).json({
        error: "Job not found",
      });
    }

    return res.json(job);
  });

  return router;
};
