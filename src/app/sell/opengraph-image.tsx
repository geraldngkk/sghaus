import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const alt = "SGHaus - Know What Your Flat Is Really Worth";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  const imageBuffer = await readFile(join(process.cwd(), "public", "hero-sell.jpg"));
  const imageData = `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
        }}
      >
        {/* Background image */}
        <img
          src={imageData}
          width={1200}
          height={630}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        {/* Gradient overlay matching the sell page */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(to bottom, rgba(26,26,46,0.75), rgba(26,26,46,0.65), rgba(45,106,79,0.70))",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            fontFamily: "system-ui, sans-serif",
            padding: "40px 60px",
          }}
        >
          {/* Logo icon */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 80,
              height: 80,
              borderRadius: 18,
              backgroundColor: "white",
              marginBottom: 28,
            }}
          >
            <svg width="54" height="54" viewBox="0 0 512 512" fill="none">
              <path d="M256 122 L426 278 L86 278 Z" fill="#2D6A4F" />
              <path d="M134 278 L378 278 L378 410 L134 410 Z" fill="#2D6A4F" />
              <rect x="134" y="330" width="244" height="26" fill="white" />
            </svg>
          </div>

          {/* Brand name */}
          <div
            style={{
              display: "flex",
              fontSize: 64,
              fontWeight: 700,
              color: "white",
              letterSpacing: "-1px",
              marginBottom: 14,
            }}
          >
            <span>SG</span>
            <span style={{ opacity: 0.9 }}>haus</span>
          </div>

          {/* Tagline */}
          <div
            style={{
              display: "flex",
              fontSize: 26,
              color: "rgba(255, 255, 255, 0.9)",
              maxWidth: 700,
              textAlign: "center",
              lineHeight: 1.4,
            }}
          >
            Selling your flat? Price it right.
          </div>

          {/* Subtitle */}
          <div
            style={{
              display: "flex",
              fontSize: 17,
              color: "rgba(255, 255, 255, 0.6)",
              marginTop: 14,
            }}
          >
            Data-backed pricing for sellers
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
