import { ImageResponse } from "next/og";

import { siteConfig } from "@/lib/site-config";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          background:
            "linear-gradient(135deg, #f4ede2 0%, #ead7c3 52%, #c98c62 100%)",
          color: "#1b140f",
          padding: "54px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "24px",
            borderRadius: "40px",
            border: "1px solid rgba(27, 20, 15, 0.12)",
            background: "rgba(255, 251, 246, 0.68)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            borderRadius: "32px",
            padding: "44px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "18px",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 20,
                letterSpacing: "0.38em",
                textTransform: "uppercase",
                color: "#8d6246",
              }}
            >
              Online bookstore
            </div>
            <div
              style={{
                display: "flex",
                maxWidth: 760,
                fontSize: 82,
                lineHeight: 0.94,
                fontWeight: 700,
              }}
            >
              Build a reading life with shelves that feel hand-packed.
            </div>
            <div
              style={{
                display: "flex",
                maxWidth: 680,
                fontSize: 30,
                lineHeight: 1.35,
                color: "#4f3c31",
              }}
            >
              {siteConfig.description}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 54,
                fontWeight: 700,
              }}
            >
              {siteConfig.name}
            </div>
            <div
              style={{
                display: "flex",
                padding: "16px 24px",
                borderRadius: "999px",
                background: "#1b1511",
                color: "#f4ede2",
                fontSize: 22,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              Curated shelves
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
