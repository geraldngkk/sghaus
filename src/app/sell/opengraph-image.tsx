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
            <svg width="52" height="52" viewBox="124 61 428 586" fill="none">
              <path fillRule="evenodd" d="M321.77 627.75 C284.24 581.44 234.53 516.00 236.90 516.00 C237.41 516.00 239.90 516.89 242.43 517.97 C256.36 523.94 281.61 530.80 299.50 533.48 C305.55 534.38 311.68 535.43 313.13 535.81 C314.95 536.29 319.11 540.82 326.64 550.50 C332.62 558.20 337.96 564.50 338.51 564.50 C340.57 564.50 402.87 480.54 401.69 479.36 C401.43 479.10 398.80 479.57 395.86 480.41 C392.91 481.25 384.65 483.18 377.50 484.70 C365.26 487.29 363.00 487.46 339.00 487.46 C316.79 487.47 312.00 487.19 301.88 485.25 C245.54 474.48 199.21 445.71 165.92 400.82 C139.93 365.76 124.08 318.62 124.02 276.21 C123.94 218.03 145.99 164.62 186.88 123.94 C205.29 105.63 220.17 94.83 242.00 83.95 C271.73 69.13 299.19 62.30 333.00 61.32 C368.72 60.28 399.43 66.95 432.50 82.94 C475.14 103.55 508.78 136.70 529.97 179.00 C539.04 197.11 541.93 195.00 508.12 195.00 L479.10 195.00 L473.93 187.25 C450.71 152.49 417.05 128.31 378.41 118.64 C353.03 112.28 330.34 111.78 305.24 117.01 C257.37 126.99 215.72 159.38 194.02 203.50 C186.62 218.55 183.32 228.02 179.84 244.23 C176.62 259.22 176.63 289.83 179.87 305.00 C187.07 338.72 202.90 367.35 227.14 390.50 C250.95 413.24 276.93 426.75 309.17 433.16 C325.44 436.40 351.75 436.42 367.76 433.20 C400.63 426.59 427.77 412.22 451.12 389.04 C463.51 376.74 470.81 367.47 478.40 354.40 C487.02 339.54 494.95 318.40 496.62 305.84 C497.26 301.00 497.26 301.00 460.63 301.00 L424.00 301.00 L424.00 274.50 L424.00 248.00 L487.53 248.00 C547.10 248.00 551.11 248.11 551.77 249.75 C552.16 250.71 552.48 261.62 552.49 274.00 C552.50 298.65 551.92 303.01 545.56 326.21 C529.82 383.63 479.57 467.52 395.63 576.50 C383.35 592.43 338.97 648.00 338.52 648.00 C338.34 648.00 330.80 638.89 321.77 627.75 Z" fill="#2D6A4F" />
              <circle cx="337.1" cy="277" r="48" fill="#52B788" />
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
