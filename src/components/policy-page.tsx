import Link from "next/link";

import { SectionHeading } from "@/components/section-heading";

type PolicySection = {
  title: string;
  paragraphs: string[];
};

type PolicyPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  sections: PolicySection[];
  asideTitle: string;
  asideItems: string[];
};

export function PolicyPage({
  eyebrow,
  title,
  description,
  sections,
  asideTitle,
  asideItems,
}: PolicyPageProps) {
  return (
    <main className="page-frame space-y-8">
      <section className="section-panel px-6 py-8 sm:px-8">
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
          actionHref="/contact"
          actionLabel="Contact support"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-5">
          {sections.map((section) => (
            <section key={section.title} className="section-panel px-6 py-6 sm:px-7">
              <h2 className="font-serif text-3xl leading-none text-[#1b140f]">
                {section.title}
              </h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-[#5d493d]">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="section-panel h-fit px-6 py-6 sm:px-7">
          <p className="section-kicker">{asideTitle}</p>
          <div className="mt-4 space-y-3 text-sm leading-7 text-[#5d493d]">
            {asideItems.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/contact" className="btn-primary">
              Contact support
            </Link>
            <Link href="/books" className="btn-secondary">
              Browse catalog
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}
