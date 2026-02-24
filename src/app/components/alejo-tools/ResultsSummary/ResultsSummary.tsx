import YellowButton from "../../YellowButton/YellowButton";
import styles from "./ResultsSummary.module.scss";

export default function ResultsSummary() {
	return (
		<section className={styles.resultsWrapper}>
			<h3 className={styles.title}>Resultados</h3>
			<div className={styles.resultInnerCard}>
				<div className={styles.resultTopRow}>
					<p className={styles.score}>81%</p>
					<YellowButton Clickable={false} text="Alta" Action={() => {}} />
				</div>
				<p className={styles.probabilityText}>
					Alta probabilidad de que la imagen haya sido generada por IA.
				</p>
			</div>
			<p className={styles.disclaimer}>
				Resultado probabilistico, Úsalo como señal, no como sentencia.
			</p>
		</section>
	);
}
