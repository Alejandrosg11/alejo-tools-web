import { afterEach, expect, it, vi } from "vitest";
import { loadRadarCatalog } from "./catalog.server";

vi.mock("next/cache", () => ({
  unstable_cache: (read: (url: string) => Promise<unknown>) => async (url: string) => {
    void read(url).catch(() => {});
    return { items: [], fetchedAt: Date.now() - 300_001 };
  },
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

it("comparte la lectura en curso y distingue el vacío válido de un fallo", async () => {
  vi.stubEnv("RADAR_JSON_URL", "https://example.org/radar.json");
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.spyOn(console, "error").mockImplementation(() => {});
  const fetchCatalog = vi.fn()
    .mockImplementationOnce(async () => Response.json({ version: 1, convocatorias: [] }))
    .mockImplementationOnce(async () => new Response(null, { status: 503 }))
    .mockImplementationOnce(async () => Response.json({ version: 1, convocatorias: [] }));
  vi.stubGlobal("fetch", fetchCatalog);

  const visit = () => loadRadarCatalog("2026-11-26");
  expect(await Promise.all([visit(), visit(), visit()])).toEqual([[], [], []]);
  expect(fetchCatalog).toHaveBeenCalledTimes(1);

  expect(await Promise.all([visit(), visit(), visit()])).toEqual([null, null, null]);
  expect(fetchCatalog).toHaveBeenCalledTimes(2);

  vi.advanceTimersByTime(29_999);
  expect(await visit()).toBeNull();
  expect(await visit()).toBeNull();
  expect(fetchCatalog).toHaveBeenCalledTimes(2);

  vi.advanceTimersByTime(1);
  expect(await visit()).toEqual([]);
  expect(fetchCatalog).toHaveBeenCalledTimes(3);
});
