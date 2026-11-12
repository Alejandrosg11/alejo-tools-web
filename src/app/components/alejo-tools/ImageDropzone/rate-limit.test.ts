import { describe, expect, it } from "vitest";
import { formatWait, readRateLimit } from "./rate-limit";

describe("rate-limit contract", () => {
  it("reads milliseconds from the daily body and seconds from headers conservatively", () => {
    expect(
      readRateLimit(
        { code: "RATE_LIMIT_DAILY", retryAfterMs: 86400000 },
        new Headers(),
        1000,
      ),
    ).toEqual({ kind: "daily", retryAt: 86401000 });
    expect(
      readRateLimit({}, new Headers({ "Retry-After-short": "45" }), 1000)
        .retryAt,
    ).toBe(46000);
    expect(
      readRateLimit({}, new Headers({ "Retry-After-daily": "86400" }), 1000),
    ).toEqual({ kind: "daily", retryAt: 86401000 });
    expect(
      readRateLimit(
        { retryAfterMs: 1 },
        new Headers({ "Retry-After": "45" }),
        1000,
      ).retryAt,
    ).toBe(46000);
  });
  it.each([
    null,
    {},
    { retryAfterMs: "45000" },
    { retryAfterMs: -1 },
    { retryAfterMs: Infinity },
    { retryAfterMs: Number.MAX_VALUE },
  ])("does not invent a cooldown for %j", (payload) => {
    expect(
      readRateLimit(payload, new Headers({ "Retry-After": "invalid" }), 1000)
        .retryAt,
    ).toBeNull();
  });
  it("accepts a standard HTTP date and rejects a past one", () => {
    const now = Date.UTC(2026, 10, 11);
    expect(
      readRateLimit(
        {},
        new Headers({ "Retry-After": new Date(now + 45000).toUTCString() }),
        now,
      ).retryAt,
    ).toBe(now + 45000);
    expect(
      readRateLimit(
        {},
        new Headers({ "Retry-After": new Date(now - 1000).toUTCString() }),
        now,
      ).retryAt,
    ).toBeNull();
  });
  it("formats real durations without rounding a daily block down", () => {
    expect(formatWait(45)).toBe("00:45");
    expect(formatWait(19201)).toBe("5 h 20 min 01 s");
    expect(formatWait(86400)).toBe("24 h 00 min 00 s");
  });
});
