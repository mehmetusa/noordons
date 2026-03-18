import type { Metadata } from "next";

import { PolicyPage } from "@/components/policy-page";
import { siteConfig } from "@/lib/site-config";

const sections = [
  {
    title: "Processing times",
    paragraphs: [
      "Most in-stock orders are reviewed and prepared for shipment within one to two business days. Processing timelines may be longer during holidays, major promotions, weather events, or when additional address verification is required.",
      "Orders placed after business hours, on weekends, or on observed holidays begin processing on the next business day.",
    ],
  },
  {
    title: "Shipping methods and delivery",
    paragraphs: [
      "Available shipping methods and charges are presented at checkout. Delivery estimates are carrier estimates only and are not guaranteed unless explicitly stated otherwise.",
      "Customers are responsible for providing complete and accurate shipping details. Noordons Books is not responsible for delivery delays caused by incorrect addresses, carrier exceptions, customs processing, or events outside our control.",
    ],
  },
  {
    title: "Order tracking and partial shipments",
    paragraphs: [
      "When tracking is available, shipping confirmation and tracking details are sent to the email used for checkout. If an order contains titles with different availability windows, we may hold or split fulfillment depending on operational needs.",
      "If a shipment arrives damaged or incomplete, contact support promptly with the order number, photos if available, and a description of the issue so we can review the claim.",
    ],
  },
  {
    title: "Domestic and wholesale handling",
    paragraphs: [
      "Shipping coverage, carrier selection, and service levels may vary based on destination, package size, and order mix. Wholesale, bulk, or special-order requests may require separate freight handling and timing.",
      `For time-sensitive questions, customers should contact ${siteConfig.email} or ${siteConfig.phone} during support hours before placing the order whenever possible.`,
    ],
  },
];

export const metadata: Metadata = {
  title: "Shipping Policy",
  description:
    "Shipping and order processing expectations for Noordons Books customers.",
};

export default function ShippingPage() {
  return (
    <PolicyPage
      eyebrow="Shipping Policy"
      title="How orders are processed, packed, and delivered."
      description="This policy explains Noordons Books order processing timelines, shipping expectations, tracking, and the customer responsibilities that help deliveries arrive correctly."
      sections={sections}
      asideTitle="Shipping basics"
      asideItems={[
        "Processing window: 1-2 business days for most in-stock orders",
        `Support hours: ${siteConfig.supportHours}`,
        `Support contact: ${siteConfig.email}`,
        "Carrier delivery estimates are not guaranteed.",
      ]}
    />
  );
}
