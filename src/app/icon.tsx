import { ImageResponse } from "next/og";
import { loadGoogleFont } from "@/lib/og-font";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  const fontData = await loadGoogleFont("Roboto", 900);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000",
          borderRadius: 7,
          fontSize: 16,
          fontWeight: 900,
          fontFamily: "Roboto",
        }}
      >
        <span style={{ color: "#c6ff00" }}>D</span>
        <span style={{ color: "#fff" }}>G</span>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Roboto", data: fontData, weight: 900, style: "normal" }],
    }
  );
}
