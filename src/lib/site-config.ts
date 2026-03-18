export type SocialPlatform = "instagram" | "x" | "facebook" | "pinterest";

export type SocialLink = {
  platform: SocialPlatform;
  label: string;
  handle: string;
  href: string;
  note: string;
};

export const siteConfig = {
  name: "Noordons Books",
  description:
    "A curated online bookstore with premium editorial shelves, giftable editions, and a live MongoDB-backed catalog.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  email: "info@noordons.com",
  phone: "+1 (202) 844-9087",
  supportHours: "Monday to Friday, 9 AM to 6 PM Eastern",
  addressLines: ["3548 Finish Line Drive", "Gainesville Va 20155"],
  socialLinks: [
    {
      platform: "instagram",
      label: "Instagram",
      handle: "@noordonsbooks",
      href: "https://instagram.com/noordonsbooks",
      note: "Follow us for book recommendations and updates.",}
  ] satisfies SocialLink[],
};
