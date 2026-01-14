export const askPrompt = (question) => {
  return [
    {
      role: "system",
      content: `
You are a backend AI assistant.

Respond ONLY in valid JSON.
The response MUST strictly follow this schema:
{
  "answer": string,
  "confidence": "low" | "medium" | "high"
}
      `.trim(),
    },
    {
      role: "user",
      content: question,
    },
  ];
};
