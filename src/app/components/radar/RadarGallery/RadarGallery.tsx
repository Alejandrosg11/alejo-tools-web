"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { listRadarOpportunities, radarToday, type RadarOpportunity } from "@/lib/radar/catalog";
import RadarCard from "../RadarCard/RadarCard";
import RadarSkeleton from "./RadarSkeleton";
import styles from "./RadarGallery.module.scss";

export default function RadarGallery({ items, initialDate }: {
  items: RadarOpportunity[] | null;
  initialDate: string;
}) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [pending, startTransition] = useTransition();
  const gridRef = useRef<HTMLUListElement>(null);
  const router = useRouter();

  useEffect(() => {
    const update = () => setCurrentDate(radarToday());
    const interval = window.setInterval(update, 1000);
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const statusTexts = grid.querySelectorAll<HTMLElement>("[data-radar-status]");
    const alignTitles = () => {
      const height = Math.max(0, ...Array.from(statusTexts, (text) => text.offsetHeight));
      grid.style.setProperty("--radar-status-height", `${height}px`);
    };

    alignTitles();
    const observer = new ResizeObserver(alignTitles);
    statusTexts.forEach((text) => observer.observe(text));
    return () => observer.disconnect();
  }, [items, currentDate, initialDate, pending]);

  if (pending) return <RadarSkeleton />;
  if (!items) {
    return (
      <div className={styles.message}>
        <p role="status">No pudimos cargar las convocatorias en este momento.</p>
        <button type="button" onClick={() => startTransition(() => router.refresh())}>Reintentar</button>
      </div>
    );
  }

  const visible = listRadarOpportunities(items, currentDate > initialDate ? currentDate : initialDate);
  if (!visible.length) {
    return <p className={styles.message} role="status">Por ahora no hay convocatorias disponibles. Vuelve pronto para ver nuevas oportunidades.</p>;
  }

  return (
    <ul ref={gridRef} className={styles.grid} aria-label="Convocatorias">
      {visible.map((item) => <li key={item.id}><RadarCard item={item} /></li>)}
    </ul>
  );
}
