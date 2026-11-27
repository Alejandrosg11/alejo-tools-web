import styles from "./RadarGallery.module.scss";

export default function RadarSkeleton() {
  return (
    <div role="status">
      <span className={styles.srOnly}>Cargando convocatorias…</span>
      <div className={styles.grid} aria-hidden="true">
        {Array.from({ length: 3 }, (_, index) => (
          <div className={styles.skeleton} key={index}>
            <div className={styles.skeletonPoster} />
            <div className={styles.skeletonBody}><span /><span /><span /><span /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
