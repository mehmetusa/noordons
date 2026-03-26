import type { Metadata } from "next";

import { SectionHeading } from "@/components/section-heading";
import { SocialLinks } from "@/components/social-links";
import { serviceHighlights } from "@/data/sample-books";
import { getBooks } from "@/lib/books";
import { siteConfig } from "@/lib/site-config";
import { buildStoreStats } from "@/lib/store-stats";

const editorialPrinciples = [
  {
    title: "Merchandising with point of view",
    copy: "Noordons is built to feel like a bookseller assembled the shelf by hand, with context, seasonality, and gift-worthiness driving the layout.",
  },
  {
    title: "Operational details still matter",
    copy: "The visual language is warm, but the plumbing underneath is practical: MongoDB catalog data, protected admin tooling, and Stripe checkout.",
  },
  {
    title: "Community is part of the product",
    copy: "The store should feel shareable, taggable, and conversation-friendly across Instagram, Facebook, Pinterest, and X from day one.",
  },
];

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn how Noordons Books combines editorial curation, premium presentation, and operational storefront tooling.",
};

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const storeStats = buildStoreStats(await getBooks());

  return (
    <main className="page-frame space-y-8">
      <section className="section-panel px-6 py-8 sm:px-8">
        <SectionHeading
          eyebrow="About Noordons"
          title="An online bookstore shaped like a great front table."
          description="Noordons Books was designed to feel closer to a thoughtful independent shop than a commodity grid: more story, more curation, and clearer reasons to pick up a title."
          actionHref="/contact"
          actionLabel="Contact the shop"
        />

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {storeStats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <p className="font-serif text-4xl leading-none text-[#1b140f]">
                {stat.value}
              </p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.26em] text-[#8d6246]">
                {stat.label}
              </p>
              <p className="mt-3 text-sm leading-7 text-[#5d493d]">
                {stat.copy}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="section-panel px-6 py-7 sm:px-8">
          <p className="section-kicker">Store story</p>
          <h2 className="mt-3 font-serif text-4xl leading-none text-[#1b140f] sm:text-5xl">
            Built for readers who want stronger context, not just more choice.
          </h2>
          <div className="prose-copy mt-6 space-y-4">
            <p>
              Noordons began as a storefront concept for premium editions,
              seasonal recommendations, and gift-ready presentation. The goal
              was to make a digital bookstore feel curated instead of merely
              searchable.
            </p>
            <p>
              That is why the site mixes tactile visuals with operational pieces
              that matter in a real shop: inventory visibility, editorial
              merchandising, social sharing, and an admin area that can add live
              catalog records with hosted cover images.
            </p>
            <p>
              The result is a store that can act like a polished concept brand
              in public while still supporting the practical work behind it.
            </p>
          </div>
        </div>

        <div className="section-panel px-6 py-7 sm:px-8">
          <p className="section-kicker">Editorial principles</p>
          <div className="mt-6 space-y-4">
            {editorialPrinciples.map((principle) => (
              <div
                key={principle.title}
                className="rounded-[1.35rem] border border-black/10 bg-white/50 p-4"
              >
                <h3 className="font-serif text-2xl leading-none text-[#1b140f]">
                  {principle.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#5d493d]">
                  {principle.copy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-panel px-6 py-7 sm:px-8">
        <SectionHeading
          eyebrow="Social channels"
          title="The bookstore is share-ready across the channels readers already use."
          description={`Use ${siteConfig.socialLinks[0].handle} for display moments, gift-table styling, and new-title drops, or catch shop updates on the rest of the network.`}
        />

        <SocialLinks className="mt-8" />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {serviceHighlights.map((highlight) => (
          <div key={highlight.title} className="stat-card">
            <h3 className="font-serif text-3xl leading-none text-[#1b140f]">
              {highlight.title}
            </h3>
            <p className="mt-4 text-sm leading-7 text-[#5d493d]">
              {highlight.description}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}
