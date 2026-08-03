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
          background: "#0b1220",
          color: "#3b82f6",
          fontSize: 244,
          fontWeight: 700,
        }}
      >
        DG
      </div>
    ),
    { width: 512, height: 512 }
  );
}
