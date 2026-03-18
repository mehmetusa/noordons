import type { Metadata } from "next";

import { PolicyPage } from "@/components/policy-page";
import { siteConfig } from "@/lib/site-config";

const sections = [
  {
    title: "Return eligibility",
    paragraphs: [
      "Return requests should be submitted within 14 days of delivery unless a different window is stated for a specific product or promotion. Returned items should be in saleable condition, with any included inserts, jackets, or bundled materials intact.",
      "We may decline returns for items that show significant wear, damage caused after delivery, marked use, or signs that the product is no longer resaleable.",
    ],
  },
  {
    title: "Damaged, defective, or incorrect items",
    paragraphs: [
      "If an item arrives damaged, defective, or does not match the order, contact support promptly with the order number and photos where available. We will review the issue and, when appropriate, arrange a replacement, refund, or other resolution.",
      "Claims for shipping damage or fulfillment errors should be reported as soon as possible so carrier and operational investigations can be completed in a timely manner.",
    ],
  },
  {
    title: "Refunds and credits",
    paragraphs: [
      "Approved refunds are issued to the original payment method unless another remedy is agreed in writing. Original shipping charges are generally non-refundable unless the return is due to our error or a verified carrier issue.",
      "Refund timing depends on payment processor and banking timelines. Once approved, most refunds appear within several business days, though exact timing can vary by card issuer.",
    ],
  },
  {
    title: "Non-returnable and special-order items",
    paragraphs: [
      "Signed copies, personalized items, final-sale promotions, and special-order or wholesale items may be non-returnable unless they arrive damaged or incorrect. Any such restrictions should be reviewed before purchase.",
      "If you are placing a large, bulk, or business order, contact us before purchase so we can clarify return handling and fulfillment expectations in advance.",
    ],
  },
];

export const metadata: Metadata = {
  title: "Returns and Refunds",
  description:
    "Return, replacement, and refund expectations for Noordons Books orders.",
};

export default function ReturnsPage() {
  return (
    <PolicyPage
      eyebrow="Returns and Refunds"
      title="How return requests, replacements, and refunds are handled."
      description="This policy describes when items may be returned, how damaged or incorrect shipments are reviewed, and how refunds are processed once a return or claim is approved."
      sections={sections}
      asideTitle="Returns support"
      asideItems={[
        "Standard return request window: 14 days from delivery",
        `Returns contact: ${siteConfig.email}`,
        "Approved refunds go back to the original payment method.",
        "Special-order, signed, and wholesale items may have additional limits.",
      ]}
    />
  );
}
