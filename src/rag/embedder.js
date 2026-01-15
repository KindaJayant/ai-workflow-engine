export const embedText = (text) => {
  const vector = new Array(26).fill(0);

  for (const char of text.toLowerCase()) {
    const idx = char.charCodeAt(0) - 97;
    if (idx >= 0 && idx < 26) {
      vector[idx]++;
    }
  }

  return vector;
};
