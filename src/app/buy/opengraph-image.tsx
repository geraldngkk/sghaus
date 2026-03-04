import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "SGHaus - Know What to Offer Before You Walk In";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  const imageData = await fetch(
    new URL("../../../public/hero-bg.jpg", import.meta.url),
  ).then((res) => res.arrayBuffer());

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
          src={imageData as unknown as string}
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
        {/* Gradient overlay matching the buy page */}
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
            <svg width="50" height="50" viewBox="0 0 512 512" fill="none">
              <rect x="128" y="244" width="256" height="168" fill="#2D6A4F" />
              <path d="M96 256L256 124L416 256H96Z" fill="#2D6A4F" />
              <path
                d="M220 412V340C220 320.118 236.118 304 256 304C275.882 304 292 320.118 292 340V412H220Z"
                fill="white"
              />
              <rect x="152" y="276" width="48" height="36" rx="4" fill="white" />
              <rect x="312" y="276" width="48" height="36" rx="4" fill="white" />
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
            Know What to Offer Before You Walk In
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
            Data-backed resale offer calculator
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
