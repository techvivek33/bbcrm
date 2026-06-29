"use client";

// Catches errors thrown anywhere — including the root layout (e.g. a database
// connection failure when env vars are misconfigured) — and shows a calm,
// branded message instead of a blank crash. Must render its own <html>/<body>.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "ui-sans-serif, system-ui, sans-serif", background: "#f6f7fb", color: "#0f172a" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ maxWidth: 440, textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "#4f46e5", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>
              AOS
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>Something went wrong</h1>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, margin: "0 0 20px" }}>
              The server couldn&apos;t complete this request. If this just went live, the most common
              cause is a missing <code>DATABASE_URL</code> / <code>SESSION_SECRET</code> environment
              variable on the host. Check the deployment&apos;s runtime logs.
            </p>
            <button
              onClick={() => reset()}
              style={{ background: "#4f46e5", color: "#fff", border: 0, borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
