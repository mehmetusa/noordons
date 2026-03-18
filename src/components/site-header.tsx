import Image from "next/image";
import Link from "next/link";

import { AuthControls } from "@/components/auth-controls";
import { CartLink } from "@/components/cart-link";
import { siteConfig } from "@/lib/site-config";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50">
      <div className="border-b border-black/10 bg-[#1b1511] text-[#efe4d9]">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-2 text-center text-[0.68rem] font-semibold uppercase tracking-[0.34em] sm:px-6 lg:px-8">
          Curated shelves, fast dispatch, and premium gift-ready editions
        </div>
      </div>
      <div className="border-b border-black/10 bg-[rgba(247,241,231,0.88)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6 sm:py-3 lg:px-8">
          <Link
            href="/"
            aria-label={siteConfig.name}
            className="flex items-center"
          >
            <Image
              src="/noordons.svg"
              alt={siteConfig.name}
              width={720}
              height={280}
              priority
              className="h-32 w-auto object-contain sm:h-40"
            />
            <span className="sr-only">{siteConfig.name}</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/books" className="btn-secondary">
              Browse catalog
            </Link>
            <CartLink />
            <AuthControls />
          </div>
        </div>
      </div>
    </header>
  );
}
