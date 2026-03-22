import { ImageResponse } from "next/og";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";

export const alt = APP_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          {/* Logo mark — accent square with lightning bolt */}
          <svg width="56" height="56" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#5b4cff" />
            <path
              d="M18 5.5L10.5 18H15.5L13.5 26.5L21.5 14H16L18 5.5Z"
              fill="#fff"
            />
          </svg>
          <span style={{ fontSize: 56, fontWeight: 700, color: "#fafafa" }}>
            {APP_NAME}
          </span>
        </div>
        <span
          style={{
            fontSize: 24,
            color: "#a1a1aa",
            maxWidth: "600px",
            textAlign: "center",
          }}
        >
          {APP_DESCRIPTION}
        </span>
      </div>
    ),
    { ...size }
  );
}
