import YellowButton from "../../YellowButton/YellowButton";

type SupportCardProps = {
	onInviteCoffee: () => void;
};

export default function SupportCard({ onInviteCoffee }: SupportCardProps) {
	return (
		<div>
			<YellowButton
				Clickable={true}
				text="Invitame un café"
				Action={onInviteCoffee}
			/>
		</div>
	);
}
