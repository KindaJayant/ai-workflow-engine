import { searchVectors } from "./vectorStore.js";

export const retrieveRelevantChunks = (question, limit = 2) => {
  return searchVectors(question, limit)
    .filter(r => r.score > 0.1);
};
