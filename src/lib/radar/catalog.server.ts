import { unstable_cache } from "next/cache";
import { parseRadarCatalog, radarHttpsUrl } from "./catalog";

const maxBytes = 256 * 1024;
const revalidateSeconds = 300;

async function fetchCatalog(url: string) {
  try {
    const response = await fetch(url, {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok || !response.body) {
      throw new Error(`Respuesta HTTP ${response.status}.`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8", { fatal: true });
    let size = 0;
    let body = "";
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maxBytes) throw new Error("El catálogo excede 256 KiB.");
        body += decoder.decode(value, { stream: true });
      }
      body += decoder.decode();
    } finally {
      await reader.cancel().catch(() => {});
      reader.releaseLock();
    }

    return { items: parseRadarCatalog(JSON.parse(body)), fetchedAt: Date.now() };
  } catch (error) {
    console.error("[radar] Falló la lectura del catálogo:", error instanceof Error ? error.message : "Error desconocido");
    throw error;
  }
}

const cachedCatalog = unstable_cache(fetchCatalog, ["radar-catalog-v1"], {
  revalidate: revalidateSeconds,
  tags: ["radar-catalog"],
});

export async function loadRadarCatalog(today: string) {
  try {
    const url = radarHttpsUrl(process.env.RADAR_JSON_URL, "RADAR_JSON_URL");
    const catalog = await cachedCatalog(url);
    const hasVisible = catalog.items.some((item) => item.visible && item.cierre >= today);
    if (!hasVisible && Date.now() - catalog.fetchedAt >= revalidateSeconds * 1000) {
      return (await fetchCatalog(url)).items;
    }
    return catalog.items;
  } catch {
    return null;
  }
}
