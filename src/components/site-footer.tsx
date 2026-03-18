import Image from "next/image";
import Link from "next/link";

import { SocialLinks } from "@/components/social-links";
import { siteConfig } from "@/lib/site-config";

const footerLinks = [
  { href: "/books", label: "All books" },
  { href: "/about", label: "About Noordons" },
  { href: "/contact", label: "Contact" },
];

const policyLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/shipping", label: "Shipping Policy" },
  { href: "/returns", label: "Returns & Refunds" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-black/10 bg-[#1b1511] text-[#f3e8dd]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.08fr_0.7fr_0.7fr_0.9fr] lg:px-8">
        <div className="space-y-4">
          <div className="flex items-center">
            <Image
              src="/noordons.svg"
              alt={siteConfig.name}
              width={420}
              height={420}
              className="h-40 w-40 object-contain"
            />
          </div>
          <h2 className="max-w-sm font-serif text-4xl leading-none text-white">
            Built for readers who want better shelves, not just more inventory.
          </h2>
          <p className="max-w-md text-sm leading-7 text-[#cdbfae]">
            This storefront pairs a warm editorial layout with a MongoDB-backed
            catalog so it can evolve from a concept store into a live retail
            experience.
          </p>
        </div>

        <div>
          <p className="section-kicker !text-[#d7af90]">Explore</p>
          <div className="mt-4 flex flex-col gap-3 text-sm text-[#f3e8dd]">
            {footerLinks.map((link) => (
              <Link key={link.href} href={link.href} className="nav-link !text-[#f3e8dd]">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="section-kicker !text-[#d7af90]">Policies</p>
          <div className="mt-4 flex flex-col gap-3 text-sm text-[#f3e8dd]">
            {policyLinks.map((link) => (
              <Link key={link.href} href={link.href} className="nav-link !text-[#f3e8dd]">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="section-kicker !text-[#d7af90]">Store notes</p>
          <div className="mt-4 space-y-3 text-sm leading-7 text-[#cdbfae]">
            <p>{siteConfig.email}</p>
            <p>{siteConfig.phone}</p>
            <p>{siteConfig.supportHours}</p>
          </div>

          <SocialLinks theme="dark" className="mt-6" />
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-5 text-center text-xs uppercase tracking-[0.18em] text-[#cdbfae] sm:px-6 lg:px-8">
        © 2026 noordons.com. All Rights Reserved.
      </div>
    </footer>
  );
}
