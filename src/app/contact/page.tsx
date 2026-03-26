import type { Metadata } from "next";

import { ContactForm } from "@/components/contact-form";
import { SectionHeading } from "@/components/section-heading";
import { SocialLinks } from "@/components/social-links";
import { getCurrentUser } from "@/lib/auth";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach Noordons Books for order questions, wholesale, events, and customer support.",
};

export default async function ContactPage() {
  const currentUser = await getCurrentUser();

  return (
    <main className="page-frame space-y-8">
      <section className="section-panel px-6 py-8 sm:px-8">
        <SectionHeading
          eyebrow="Contact"
          title="Talk to the shop."
          description="Reach out for order support, press notes, wholesale requests, reading-group questions, or event ideas. The contact form can forward messages to the shop inbox and archive them in MongoDB."
          actionHref="/about"
          actionLabel="Read our story"
        />

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="stat-card">
            <p className="section-kicker">Email</p>
            <p className="mt-4 font-serif text-3xl leading-none text-[#1b140f]">
              {siteConfig.email}
            </p>
            <p className="mt-4 text-sm leading-7 text-[#5d493d]">
              Best for orders, wholesale, and event planning.
            </p>
          </div>
          <div className="stat-card">
            <p className="section-kicker">Phone</p>
            <p className="mt-4 font-serif text-3xl leading-none text-[#1b140f]">
              {siteConfig.phone}
            </p>
            <p className="mt-4 text-sm leading-7 text-[#5d493d]">
              For time-sensitive shipping questions during support hours.
            </p>
          </div>
          <div className="stat-card">
            <p className="section-kicker">Support hours</p>
            <p className="mt-4 font-serif text-3xl leading-none text-[#1b140f]">
              Weekdays
            </p>
            <p className="mt-4 text-sm leading-7 text-[#5d493d]">
              {siteConfig.supportHours}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
        <ContactForm
          initialName={currentUser?.name}
          initialEmail={currentUser?.email}
        />

        <div className="space-y-6">
          <section className="section-panel px-6 py-6 sm:px-7">
            <p className="section-kicker">Visit and write</p>
            <h2 className="mt-3 font-serif text-4xl leading-none text-[#1b140f]">
              Shop contact details.
            </h2>
            <div className="mt-6 space-y-4 text-sm leading-7 text-[#5d493d]">
              <p>{siteConfig.addressLines[0]}</p>
              <p>{siteConfig.addressLines[1]}</p>
              <p>
                Orders, event notes, and wholesale questions can all start with
                the form on this page.
              </p>
            </div>
          </section>

          <section className="section-panel px-6 py-6 sm:px-7">
            <p className="section-kicker">Social desk</p>
            <p className="mt-4 text-sm leading-7 text-[#5d493d]">
              Social is part of the storefront now, not an afterthought. Use
              these channels for launches, shelf styling, shareable lists, and
              fast updates from the shop.
            </p>

            <SocialLinks className="mt-6" />

            <div className="mt-6 space-y-4">
              {siteConfig.socialLinks.map((link) => (
                <div
                  key={link.platform}
                  className="rounded-[1.25rem] border border-black/10 bg-white/50 p-4"
                >
                  <p className="section-kicker">{link.label}</p>
                  <p className="mt-3 text-sm leading-7 text-[#5d493d]">
                    {link.note}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
