export const ragPrompt = (question, contextChunks) => {
  const context = contextChunks
    .map((c, i) => `Source ${i + 1}:\n${c.text}`)
    .join("\n\n");

  return [
    {
      role: "system",
      content: `
You are an AI assistant.
Answer ONLY using the provided sources.
If the answer is not in the sources, say "I don't know".
Respond in JSON:
{
  "answer": string,
  "sources": string[]
}
      `.trim(),
    },
    {
      role: "user",
      content: `
Question: ${question}

Sources:
${context}
      `.trim(),
    },
  ];
};
