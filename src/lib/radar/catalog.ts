export interface RadarOpportunity {
  id: string;
  titulo: string;
  descripcion: string;
  categorias: string[];
  organizador: string;
  alcance: string;
  premios?: string;
  costo?: string;
  cierre: string;
  apertura?: string;
  visible: boolean;
  enlaceOficial: string;
  imagen?: { url: string; alt: string };
}

const day = 86_400_000;
const radarDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Mexico_City",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const displayDate = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeZone: "UTC",
});

export function radarToday(now = new Date()) {
  const parts = Object.fromEntries(radarDate.formatToParts(now).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function formatRadarDate(date: string) {
  return displayDate.format(new Date(date));
}

export function listRadarOpportunities(items: RadarOpportunity[], today: string) {
  return items.filter(({ visible, cierre }) => visible && cierre >= today)
    .map((item) => {
      const upcoming = Boolean(item.apertura && item.apertura > today);
      const daysLeft = (Date.parse(item.cierre) - Date.parse(today)) / day;
      const color = daysLeft <= 2 ? "red" : daysLeft < 7 ? "yellow" : "green";
      const label = upcoming ? "Próxima" : daysLeft === 0 ? "Cierra hoy"
        : daysLeft <= 2 ? "Cierra pronto" : daysLeft < 7 ? "Cierra en menos de 7 días" : "Abierta";
      return { ...item, upcoming, color, label };
    })
    .sort((a, b) => Number(a.upcoming) - Number(b.upcoming)
      || (a.upcoming ? a.apertura! : a.cierre).localeCompare(b.upcoming ? b.apertura! : b.cierre));
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Se esperaba un objeto en el catálogo.");
  }
  return value as Record<string, unknown>;
}

function field(value: unknown, name: string, max: number): string {
  if (typeof value !== "string" || !value.trim() || value.length > max) {
    throw new Error(`Campo inválido: ${name}.`);
  }
  return value.trim();
}

function optionalField(value: unknown, name: string, max: number) {
  return value === undefined ? undefined : field(value, name, max);
}

export function radarHttpsUrl(value: unknown, name: string) {
  const url = new URL(field(value, name, 2048));
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error(`URL HTTPS inválida: ${name}.`);
  }
  return url.href;
}

function dateField(value: unknown, name: string) {
  const date = field(value, name, 10);
  const timestamp = Date.parse(date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(timestamp)
    || new Date(timestamp).toISOString().slice(0, 10) !== date) {
    throw new Error(`Fecha inválida: ${name}.`);
  }
  return date;
}

export function parseRadarCatalog(value: unknown): RadarOpportunity[] {
  const catalog = record(value);
  if (catalog.version !== 1 || !Array.isArray(catalog.convocatorias)
    || catalog.convocatorias.length > 100) {
    throw new Error("Versión o listado de convocatorias inválido.");
  }

  const ids = new Set<string>();
  return catalog.convocatorias.map((entry) => {
    const item = record(entry);
    const id = field(item.id, "id", 100);
    const cierre = dateField(item.cierre, "cierre");
    const apertura = item.apertura === undefined ? undefined : dateField(item.apertura, "apertura");
    const categorias = field(item.categoria, "categoria", 160).split(",").map((part) => part.trim());
    if (ids.has(id) || categorias.some((category) => !category)
      || (apertura && apertura > cierre)
      || (item.visible !== undefined && typeof item.visible !== "boolean")) {
      throw new Error("ID duplicado, categoría, visibilidad o fechas incompatibles.");
    }
    ids.add(id);
    const image = item.imagen === undefined ? undefined : record(item.imagen);
    const imageUrl = image?.url;
    const hasImage = imageUrl !== undefined && !(typeof imageUrl === "string" && !imageUrl.trim());

    return {
      id, cierre, apertura, categorias,
      titulo: field(item.titulo, "titulo", 160),
      descripcion: field(item.descripcion, "descripcion", 1000),
      organizador: field(item.organizador, "organizador", 160),
      alcance: field(item.alcance, "alcance", 160),
      premios: optionalField(item.premios, "premios", 500),
      costo: optionalField(item.costo, "costo", 160),
      visible: item.visible !== false,
      enlaceOficial: radarHttpsUrl(item.enlaceOficial, "enlaceOficial"),
      imagen: image && hasImage ? {
        url: radarHttpsUrl(image.url, "imagen.url"),
        alt: field(image.alt, "imagen.alt", 300),
      } : undefined,
    };
  });
}
