import { ImageResponse } from "next/og";
import { loadGoogleFont } from "@/lib/og-font";

export const dynamic = "force-static";

export async function GET() {
  const fontData = await loadGoogleFont("Space Grotesk", 700);

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
          fontSize: 244,
          fontWeight: 700,
          fontFamily: "Space Grotesk",
        }}
      >
        <span style={{ color: "#c6ff00" }}>D</span>
        <span style={{ color: "#fff" }}>G</span>
      </div>
    ),
    {
      width: 512,
      height: 512,
      fonts: [{ name: "Space Grotesk", data: fontData, weight: 700, style: "normal" }],
    }
  );
}
