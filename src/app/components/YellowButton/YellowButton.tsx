import styles from "./YellowButton.module.scss";

type YellowButtonProps = {
  Clickable: boolean;
  text: string;
  Action: () => void;
};

export default function YellowButton({ Clickable, text, Action }: YellowButtonProps) {
  return (
    <button
      type="button"
      className={styles.yellowButton}
      onClick={Clickable ? Action : undefined}
      disabled={!Clickable}
      aria-disabled={!Clickable}
    >
      {text}
    </button>
  );
}
