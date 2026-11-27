import { describe, expect, it } from "vitest";
import { listRadarOpportunities, parseRadarCatalog, radarToday } from "./catalog";

const opportunity = {
  id: "trazo",
  titulo: "Premio Trazo Joven",
  descripcion: "Concurso de ilustración.",
  categoria: "Ilustración, Diseño Gráfico",
  organizador: "Colectivo Trazo",
  alcance: "México",
  cierre: "2026-11-29",
  enlaceOficial: "https://example.org/trazo",
};

const parse = (...convocatorias: unknown[]) => parseRadarCatalog({ version: 1, convocatorias });

describe("catálogo de Radar Creativo", () => {
  it("aplica los límites del calendario y excluye tarjetas ocultas o vencidas", () => {
    const items = parse(opportunity, { ...opportunity, id: "oculta", visible: false });
    expect(items[0].categorias).toEqual(["Ilustración", "Diseño Gráfico"]);
    for (const [date, color] of [
      ["2026-11-22", "green"],
      ["2026-11-23", "yellow"],
      ["2026-11-26", "yellow"],
      ["2026-11-27", "red"],
      ["2026-11-29", "red"],
    ]) {
      expect(listRadarOpportunities(items, date).map((item) => item.color)).toEqual([color]);
    }
    expect(listRadarOpportunities(items, "2026-11-30")).toEqual([]);
  });

  it("usa el calendario de Ciudad de México y ordena las próximas después de las abiertas", () => {
    expect(radarToday(new Date("2026-11-30T05:59:59Z"))).toBe("2026-11-29");
    expect(radarToday(new Date("2026-11-30T06:00:00Z"))).toBe("2026-11-30");
    const items = parse({ ...opportunity, id: "proxima", apertura: "2026-11-29" }, opportunity);
    expect(listRadarOpportunities(items, "2026-11-28").map(({ id, upcoming }) => [id, upcoming]))
      .toEqual([["trazo", false], ["proxima", true]]);
    expect(listRadarOpportunities(items, "2026-11-29").every(({ upcoming }) => !upcoming)).toBe(true);
  });

  it("acepta convocatorias sin cartel y valida las URLs de imagen que sí se proporcionan", () => {
    for (const imagen of [undefined, {}, { url: "", alt: "Cartel pendiente" }, { url: " " }]) {
      expect(parse({ ...opportunity, imagen })[0].imagen).toBeUndefined();
    }
    const imagen = { url: "https://example.org/cartel.webp", alt: "Cartel" };
    expect(parse({ ...opportunity, imagen })[0].imagen).toEqual(imagen);
    expect(() => parse({ ...opportunity, imagen: { ...imagen, url: "http://example.org/cartel.webp" } })).toThrow();
  });

  it("rechaza duplicados, fechas inválidas, enlaces inseguros y visibilidad no booleana", () => {
    expect(() => parse(opportunity, opportunity)).toThrow();
    for (const invalid of [
      { cierre: "2026-11-29T00:00:00-06:00" },
      { cierre: "2026-02-30" },
      { apertura: "2026-11-30" },
      { enlaceOficial: "javascript:alert(1)" },
      { visible: "false" },
    ]) {
      expect(() => parse({ ...opportunity, ...invalid })).toThrow();
    }
  });
});
