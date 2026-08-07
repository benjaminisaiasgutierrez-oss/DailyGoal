import { ImageResponse } from "next/og";

export async function GET() {
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
        }}
      >
        <span style={{ color: "#c6ff00" }}>D</span>
        <span style={{ color: "#fff" }}>G</span>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
