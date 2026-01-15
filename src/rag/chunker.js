export const chunkText = (text, size = 200) => {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    chunks.push(text.slice(start, start + size));
    start += size;
  }

  return chunks;
};
