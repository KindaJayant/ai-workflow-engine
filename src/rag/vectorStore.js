import { documents } from "./documents.js";
import { chunkText } from "./chunker.js";
import { embedText } from "./embedder.js";
import { cosineSimilarity } from "./similarity.js";

const vectors = [];

documents.forEach(doc => {
  const chunks = chunkText(doc.text);
  chunks.forEach(chunk => {
    vectors.push({
      docId: doc.id,
      text: chunk,
      embedding: embedText(chunk),
    });
  });
});

export const searchVectors = (query, limit = 2) => {
  const queryEmbedding = embedText(query);

  return vectors
    .map(v => ({
      ...v,
      score: cosineSimilarity(queryEmbedding, v.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};
