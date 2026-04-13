interface Props {
  title: string;
}

export function CardTitle({ title }: Props) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-4">
      {title}
    </p>
  );
}

export default CardTitle;
