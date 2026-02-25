import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "SGHaus — Know What to Offer Before You Walk In";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #1B4332 0%, #2D6A4F 50%, #40916C 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Logo icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
            borderRadius: 20,
            backgroundColor: "white",
            marginBottom: 32,
          }}
        >
          <svg
            width="60"
            height="60"
            viewBox="0 0 512 512"
            fill="none"
          >
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
            fontSize: 72,
            fontWeight: 700,
            color: "white",
            letterSpacing: "-1px",
            marginBottom: 16,
          }}
        >
          <span>SG</span>
          <span style={{ opacity: 0.9 }}>haus</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: "rgba(255, 255, 255, 0.85)",
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
            fontSize: 18,
            color: "rgba(255, 255, 255, 0.6)",
            marginTop: 16,
          }}
        >
          Data-driven HDB resale offer calculator
        </div>
      </div>
    ),
    { ...size },
  );
}
