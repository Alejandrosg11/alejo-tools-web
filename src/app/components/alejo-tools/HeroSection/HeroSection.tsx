import styles from "./HeroSection.module.scss";

export default function HeroSection() {
  return (
    <section className={styles.heroSection}>
      <h2 className={styles.title}>
        Detector <span className={styles.accent}>IA</span> para imágenes
      </h2>
      <p className={styles.description}>
        Analiza una imagen y obtén una estimación probabilística de contenido generado por IA.
      </p>
      <p className={styles.subDescription}>
        No estamos en contra de la IA. <span className={styles.bold}>Promovemos el uso responsable</span>, con consentimiento y respeto al trabajo artístico.
      </p>
    </section>
  );
}
