import type { Metadata } from "next";

import { PolicyPage } from "@/components/policy-page";
import { siteConfig } from "@/lib/site-config";

const sections = [
  {
    title: "What we collect",
    paragraphs: [
      "We collect the information you provide directly when you create an account, save billing or shipping addresses, place an order, submit a contact form, or communicate with our support team. This can include your name, email address, phone number, postal address, and order details.",
      "We also collect operational information needed to run the storefront, including cart contents on your device, session identifiers for authentication, and basic analytics or server logs used to maintain site performance and security.",
    ],
  },
  {
    title: "How we use your information",
    paragraphs: [
      "We use personal information to provide core retail services: authenticate your account, process and fulfill orders, create Stripe checkout sessions, store order history, support customer service, and maintain billing and shipping records tied to your purchases.",
      "We may also use contact information to respond to support inquiries, handle wholesale questions, verify orders, and communicate service-related notices such as shipping updates, account changes, or payment confirmations.",
    ],
  },
  {
    title: "Payments and third parties",
    paragraphs: [
      "Payments are processed through Stripe. Payment card details are not stored directly in this storefront. Billing and shipping data submitted during checkout may be shared with Stripe and other service providers strictly to process transactions, generate invoices, and complete delivery.",
      "We may rely on third-party providers for hosting, image delivery, database infrastructure, and communications. Those providers only receive the information needed to perform their services for Noordons Books.",
    ],
  },
  {
    title: "Retention and security",
    paragraphs: [
      "We retain account, order, and address information for as long as reasonably necessary to operate the store, comply with legal or tax obligations, resolve disputes, and maintain business records.",
      "We use commercially reasonable safeguards to protect stored information, but no internet transmission or storage system can be guaranteed completely secure. Customers should use strong passwords and contact us promptly if they suspect unauthorized account activity.",
    ],
  },
  {
    title: "Your choices",
    paragraphs: [
      `You may contact ${siteConfig.email} to request updates to your account information, ask questions about stored order data, or request deletion where legally appropriate.`,
      "If you no longer wish to keep saved addresses on file, you may update or overwrite them from your account dashboard. We may still retain order records that must be preserved for business, accounting, or compliance purposes.",
    ],
  },
];

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Noordons Books collects, uses, and stores customer and order information.",
};

export default function PrivacyPage() {
  return (
    <PolicyPage
      eyebrow="Privacy Policy"
      title="How customer and order data is handled."
      description="This policy explains what information Noordons Books collects, how that information is used to operate the storefront, and what choices customers have around stored account and order data."
      sections={sections}
      asideTitle="Policy details"
      asideItems={[
        "Effective date: March 17, 2026",
        `Support email: ${siteConfig.email}`,
        `Support phone: ${siteConfig.phone}`,
        "Review this policy periodically for updates.",
      ]}
    />
  );
}
