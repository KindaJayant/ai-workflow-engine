import { randomUUID } from "crypto";

const jobs = new Map();

export const createJob = (payload) => {
  const id = randomUUID();

  jobs.set(id, {
    id,
    status: "pending",
    result: null,
    error: null,
    createdAt: Date.now(),
  });

  return id;
};

export const updateJob = (id, updates) => {
  if (!jobs.has(id)) return;
  jobs.set(id, {
    ...jobs.get(id),
    ...updates,
  });
};

export const getJob = (id) => {
  return jobs.get(id) || null;
};
