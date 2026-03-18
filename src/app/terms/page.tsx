import type { Metadata } from "next";

import { PolicyPage } from "@/components/policy-page";
import { siteConfig } from "@/lib/site-config";

const sections = [
  {
    title: "Use of the storefront",
    paragraphs: [
      "By using Noordons Books, you agree to use the storefront for lawful retail browsing, account registration, and purchasing activities only. You may not interfere with site operations, attempt unauthorized access, scrape protected areas, or misuse administrative or checkout functionality.",
      "We may suspend accounts or restrict access if we believe activity is fraudulent, abusive, violates applicable law, or creates risk for the store, service providers, or other customers.",
    ],
  },
  {
    title: "Product information and availability",
    paragraphs: [
      "We aim to present accurate product metadata, pricing, inventory, and edition details, but catalog information may occasionally contain errors, delays, or supplier-driven changes. Product images and descriptions are intended to help customers evaluate a title and may not reflect every manufacturing variation.",
      "All orders remain subject to availability. If a title becomes unavailable or a listing error is discovered after purchase, we may cancel or adjust the order and notify the customer.",
    ],
  },
  {
    title: "Orders and payment",
    paragraphs: [
      "Orders are submitted when a customer completes checkout through our payment provider. Pricing, taxes, shipping charges, and promotional discounts displayed at checkout form part of the final order total.",
      "We reserve the right to refuse, limit, or cancel any order if payment cannot be verified, inventory is unavailable, address information is incomplete, or the order appears to create fraud or compliance risk.",
    ],
  },
  {
    title: "Accounts and saved information",
    paragraphs: [
      "Customers are responsible for maintaining the confidentiality of their login credentials and for activity that occurs under their account. Saved billing and shipping addresses should be kept current so invoices and deliveries are accurate.",
      "Administrative access is restricted to authorized personnel. Any attempt to access admin tooling without permission is prohibited.",
    ],
  },
  {
    title: "Limitation and updates",
    paragraphs: [
      "The storefront is provided on an as-available basis. To the fullest extent permitted by law, Noordons Books disclaims implied warranties and is not liable for indirect, incidental, or consequential damages arising from use of the site or inability to complete a purchase.",
      "We may update these terms from time to time. Continued use of the storefront after changes are posted constitutes acceptance of the updated terms.",
    ],
  },
];

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms governing use of the Noordons Books storefront, orders, and accounts.",
};

export default function TermsPage() {
  return (
    <PolicyPage
      eyebrow="Terms of Service"
      title="The rules that govern use of the store."
      description="These terms describe how customers may use the Noordons Books storefront, place orders, maintain accounts, and interact with our products and services."
      sections={sections}
      asideTitle="Storefront terms"
      asideItems={[
        "Effective date: March 17, 2026",
        `Business contact: ${siteConfig.email}`,
        "Orders are subject to availability and verification.",
        "Catalog information may change without notice.",
      ]}
    />
  );
}
