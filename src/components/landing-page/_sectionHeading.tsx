export default function SectionHeading({
  title = "Section Title",
  subtitle = "This is the Subtitle",
  description,
}: {
  title?: string;
  subtitle?: string;
  description?: string;
}) {
  return (
    <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
      <h2 className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">
        {title}
      </h2>
      <h3 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {subtitle}
      </h3>
      {description && (
        <p className="text-muted-foreground text-lg">{description}</p>
      )}
    </div>
  );
}
