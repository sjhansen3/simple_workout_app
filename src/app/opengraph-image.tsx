import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Stupid Simple Workout";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fff",
          padding: "40px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 80,
              marginBottom: 20,
            }}
          >
            💪
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: "#111",
              marginBottom: 16,
              letterSpacing: "-0.02em",
            }}
          >
            Stupid Simple Workout
          </div>
          <div
            style={{
              fontSize: 32,
              color: "#666",
              maxWidth: 700,
            }}
          >
            Create workout plans. Share with anyone. Track your progress.
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 24,
            color: "#999",
          }}
        >
          stupidsimpleworkout.com
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
