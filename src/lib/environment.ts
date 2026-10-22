// Public build-time setting; Preview builds also use NODE_ENV=production.
export const isQaEnvironment = ["qa", "staging"].includes(
  (process.env.NEXT_PUBLIC_APP_ENV || "").trim().toLowerCase(),
);
