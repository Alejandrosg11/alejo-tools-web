import YellowButton from "../../YellowButton/YellowButton";
import styles from "./ResultsSummary.module.scss";
import { DetectorResult } from "../types";

type ResultsSummaryProps = {
	result: DetectorResult | null;
};

const formatLabel = (label: DetectorResult["label"]): string => {
	return label.charAt(0).toUpperCase() + label.slice(1);
};

export default function ResultsSummary({ result }: ResultsSummaryProps) {
	if (!result) {
		return null;
	}

	return (
		<section className={styles.resultsWrapper}>
			<div className={styles.revealContent}>
				<h3 className={styles.title}>Resultados</h3>
				<div className={styles.resultInnerCard}>
					<div className={styles.resultTopRow}>
						<p className={styles.score}>{result.percentage}%</p>
						<YellowButton
							Clickable={false}
							text={formatLabel(result.label)}
							Action={() => {}}
						/>
					</div>
					<p className={styles.probabilityText}>{result.message}</p>
				</div>
				<p className={styles.disclaimer}>{result.disclaimer}</p>
			</div>
		</section>
	);
}
