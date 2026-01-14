export const validateLLMResponse = (data) => {
  if (
    typeof data !== "object" ||
    typeof data.answer !== "string" ||
    !["low", "medium", "high"].includes(data.confidence)
  ) {
    return false;
  }
  return true;
};
