import { ImageResponse } from "next/og";
import { loadGoogleFont } from "@/lib/og-font";

export const dynamic = "force-static";

export async function GET() {
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
          fontSize: 244,
          fontWeight: 900,
          fontFamily: "Roboto",
        }}
      >
        <span style={{ color: "#c6ff00" }}>D</span>
        <span style={{ color: "#fff" }}>G</span>
      </div>
    ),
    {
      width: 512,
      height: 512,
      fonts: [{ name: "Roboto", data: fontData, weight: 900, style: "normal" }],
    }
  );
}
