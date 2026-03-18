import { siteConfig, type SocialPlatform } from "@/lib/site-config";

type SocialLinksProps = {
  theme?: "light" | "dark";
  showHandles?: boolean;
  className?: string;
};

function SocialIcon({ platform }: { platform: SocialPlatform }) {
  switch (platform) {
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none" aria-hidden="true">
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="4.1" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="17.4" cy="6.6" r="1" fill="currentColor" />
        </svg>
      );
    case "x":
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
          <path d="M18.9 3H21l-4.58 5.24L21.8 21h-4.22l-3.31-7.58L7.64 21H5.5l4.89-5.59L2.2 3h4.32l2.99 6.9L18.9 3Zm-1.48 16h1.17L7.86 4.9H6.6L17.42 19Z" />
        </svg>
      );
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
          <path d="M13.27 21v-7.7h2.59l.39-3.01h-2.98V8.37c0-.87.24-1.47 1.5-1.47h1.61V4.21c-.28-.04-1.25-.12-2.38-.12-2.35 0-3.96 1.43-3.96 4.06v2.14H7.38v3.01h2.66V21h3.23Z" />
        </svg>
      );
    case "pinterest":
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
          <path d="M12 3.3c-4.77 0-7.2 3.42-7.2 6.27 0 1.73.65 3.26 2.05 3.83.23.1.44 0 .51-.24.05-.17.16-.6.21-.78.07-.24.05-.33-.14-.56-.41-.48-.67-1.1-.67-1.98 0-2.55 1.9-4.84 4.95-4.84 2.7 0 4.18 1.65 4.18 3.86 0 2.91-1.29 5.37-3.2 5.37-1.06 0-1.85-.88-1.59-1.96.3-1.29.89-2.68.89-3.61 0-.83-.45-1.52-1.37-1.52-1.08 0-1.95 1.12-1.95 2.62 0 .95.32 1.59.32 1.59l-1.29 5.46c-.38 1.61-.06 3.58-.03 3.78.02.12.17.15.24.06.1-.13 1.43-1.77 1.88-3.4.13-.46.72-2.86.72-2.86.35.68 1.38 1.28 2.47 1.28 3.25 0 5.46-2.96 5.46-6.92C19.83 6.09 16.53 3.3 12 3.3Z" />
        </svg>
      );
  }
}

export function SocialLinks({
  theme = "light",
  showHandles = true,
  className = "",
}: SocialLinksProps) {
  const isDark = theme === "dark";
  const shellClassName = isDark
    ? "border-white/12 bg-white/8 text-[#f3e8dd]"
    : "border-black/10 bg-white/58 text-[#1b140f]";
  const iconClassName = isDark
    ? "bg-white/10 text-[#f3e8dd]"
    : "bg-[#1b1511] text-[#f7f1e8]";
  const handleClassName = isDark ? "text-[#cdbfae]" : "text-[#6b584d]";

  return (
    <div className={`flex flex-wrap gap-3 ${className}`.trim()}>
      {siteConfig.socialLinks.map((link) => (
        <a
          key={link.platform}
          href={link.href}
          target="_blank"
          rel="noreferrer"
          className={`inline-flex items-center gap-3 rounded-full border px-4 py-3 transition-transform duration-200 hover:-translate-y-0.5 ${shellClassName}`}
          aria-label={`${link.label} ${link.handle}`}
        >
          <span
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${iconClassName}`}
          >
            <SocialIcon platform={link.platform} />
          </span>
          <span className="text-left">
            <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.22em]">
              {link.label}
            </span>
            {showHandles ? (
              <span className={`block text-xs ${handleClassName}`}>{link.handle}</span>
            ) : null}
          </span>
        </a>
      ))}
    </div>
  );
}
