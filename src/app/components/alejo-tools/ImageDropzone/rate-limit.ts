export type RateLimit = {
  kind: "short" | "daily" | "unknown";
  retryAt: number | null;
};

export function readRateLimit(
  payload: unknown,
  headers: Headers,
  now = Date.now(),
): RateLimit {
  const body =
    typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>)
      : {};
  const code = typeof body.code === "string" ? body.code.toUpperCase() : "";
  const kind =
    code === "RATE_LIMIT_DAILY" || headers.has("retry-after-daily")
      ? "daily"
      : code === "RATE_LIMIT_SHORT" || headers.has("retry-after-short")
        ? "short"
        : "unknown";
  const durations: number[] = [];
  if (typeof body.retryAfterMs === "number") durations.push(body.retryAfterMs);
  for (const name of [
    "retry-after",
    "retry-after-short",
    "retry-after-daily",
  ]) {
    const value = headers.get(name)?.trim();
    if (!value) continue;
    if (/^\d+(\.\d+)?$/.test(value)) durations.push(Number(value) * 1000);
    else if (name === "retry-after" && /^[A-Za-z]{3},/.test(value))
      durations.push(Date.parse(value) - now);
  }
  const valid = durations.filter(
    (ms) =>
      Number.isFinite(ms) &&
      ms > 0 &&
      Number.isSafeInteger(Math.ceil(now + ms)),
  );
  return {
    kind,
    retryAt: valid.length ? now + Math.ceil(Math.max(...valid)) : null,
  };
}

export function formatWait(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  if (s < 3600)
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  return `${Math.floor(s / 3600)} h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")} min ${String(s % 60).padStart(2, "0")} s`;
}
