"use client";

import Image from "next/image";
import { useState } from "react";
import { formatRadarDate, type listRadarOpportunities } from "@/lib/radar/catalog";
import buttonStyles from "../../YellowButton/YellowButton.module.scss";
import styles from "./RadarCard.module.scss";

function RadarPoster({ image, category }: {
  image: { url: string; alt: string };
  category: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span aria-hidden="true">{category}</span>;
  return <Image fill unoptimized referrerPolicy="no-referrer" src={image.url} alt={image.alt} onError={() => setFailed(true)} />;
}

export default function RadarCard({ item }: { item: ReturnType<typeof listRadarOpportunities>[number] }) {
  return (
    <a className={styles.card} href={item.enlaceOficial} aria-label={`Ver convocatoria oficial: ${item.titulo}`}>
      <div className={styles.poster}>
        {item.imagen
          ? <RadarPoster key={item.imagen.url} image={item.imagen} category={item.categorias[0]} />
          : <span aria-hidden="true">{item.categorias[0]}</span>}
      </div>
      <div className={styles.body}>
        <p className={`${styles.status} ${styles[item.color]}`}>
          <span data-radar-status>
            {item.label} · {item.upcoming ? "Abre el " : "Cierre: "}
            <time dateTime={item.upcoming ? item.apertura : item.cierre}>
              {formatRadarDate(item.upcoming ? item.apertura! : item.cierre)}
            </time>
          </span>
        </p>
        <h2>{item.titulo}</h2>
        <ul className={styles.categories} aria-label="Categorías">
          {item.categorias.map((category, index) => <li key={index}>{category}</li>)}
        </ul>
        <p>{item.descripcion}</p>
        <dl className={styles.details}>
          <div><dt>Organiza</dt><dd>{item.organizador}</dd></div>
          <div><dt>Alcance</dt><dd>{item.alcance}</dd></div>
          {item.premios && <div><dt>Premio</dt><dd>{item.premios}</dd></div>}
          {item.costo && <div><dt>Costo</dt><dd>{item.costo}</dd></div>}
        </dl>
        <span className={`${buttonStyles.yellowButton} ${styles.action}`}>Ver convocatoria oficial</span>
      </div>
    </a>
  );
}
