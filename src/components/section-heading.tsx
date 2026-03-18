import Link from "next/link";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  actionHref,
  actionLabel,
}: SectionHeadingProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <p className="section-kicker">{eyebrow}</p>
        <h2 className="mt-3 font-serif text-4xl leading-none tracking-tight text-[#1b140f] sm:text-5xl">
          {title}
        </h2>
        <p className="mt-4 text-base leading-8 text-[#5d493d]">{description}</p>
      </div>

      {actionHref && actionLabel ? (
        <Link href={actionHref} className="btn-secondary">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
