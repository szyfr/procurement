"use client";

/**
 * Last resort: catches a throw in the root layout itself, which is the one
 * place `(dashboard)/error.tsx` cannot reach.
 *
 * It replaces the root layout, so it has to supply its own `html`/`body` and
 * cannot count on the app's fonts, providers or stylesheet having loaded —
 * hence inline styles rather than Tailwind classes. Keep it dependency-free.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100svh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
          background: "#fff",
          color: "#0a0a0a",
        }}
      >
        <div style={{ maxWidth: "26rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.125rem", fontWeight: 700, margin: 0 }}>
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: "0.8125rem",
              lineHeight: 1.5,
              color: "#525252",
              margin: "0.5rem 0 1.5rem",
            }}
          >
            The application failed to start. Try reloading — if it keeps
            happening, contact your administrator.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              font: "inherit",
              fontSize: "0.8125rem",
              fontWeight: 500,
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "none",
              background: "#0a0a0a",
              color: "#fafafa",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest ? (
            <p
              style={{
                fontSize: "0.75rem",
                fontFamily: "ui-monospace, monospace",
                color: "#737373",
                marginTop: "1.5rem",
              }}
            >
              Reference: {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
