import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import Navbar from "@/app/components/Navbar/Navbar";
import SupportCard from "@/app/components/alejo-tools/SupportCard/SupportCard";
import RadarGallery from "@/app/components/radar/RadarGallery/RadarGallery";
import RadarSkeleton from "@/app/components/radar/RadarGallery/RadarSkeleton";
import { radarToday } from "@/lib/radar/catalog";
import { loadRadarCatalog } from "@/lib/radar/catalog.server";
import { isQaEnvironment } from "@/lib/environment";
import styles from "./page.module.scss";

const title = "Radar Creativo | Alejo Draws";
const description = "Encuentra convocatorias de ilustración, manga y cómic, becas, exposiciones y eventos para la comunidad artística.";
const url = "https://alejodraws.com/radar";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, type: "website", locale: "es_MX" },
  ...(isQaEnvironment && { robots: { index: false, follow: false } }),
};

async function Catalog() {
  await connection();
  const items = await loadRadarCatalog(radarToday());
  return <RadarGallery items={items} initialDate={radarToday()} />;
}

export default function RadarPage() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.content}>
          <header className={styles.header}>
            <div className={styles.intro}>
              <h1>Radar <span className={styles.accent}>Creativo</span></h1>
              <p>Convocatorias para la comunidad artística.</p>
              <p><strong className={styles.accent}>Alejo Draws</strong> difunde estas oportunidades. Consulta las bases y participa directamente con cada organizador.</p>
            </div>
            <SupportCard inline />
          </header>
          <Suspense fallback={<RadarSkeleton />}>
            <Catalog />
          </Suspense>
        </div>
      </main>
    </>
  );
}
