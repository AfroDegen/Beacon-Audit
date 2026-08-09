"use client";

import { useState } from "react";

export default function Home() {
  const [business, setBusiness] = useState("");
  const [city, setCity] = useState("Plano, Texas");
  const [intent, setIntent] = useState("emergency AC repair");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult("");

    const response = await fetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        business_name: business,
        city,
        category: "HVAC contractor",
        intent
      })
    });

    setResult(JSON.stringify(await response.json(), null, 2));
    setLoading(false);
  }

  return (
    <main style={{ maxWidth: 600, margin: "40px auto", padding: 20 }}>
      <h1>Beacon Audit</h1>

      <form onSubmit={submit}>
        <input
          placeholder="Business name"
          value={business}
          onChange={(e) => setBusiness(e.target.value)}
        />

        <input
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />

        <input
          placeholder="Customer intent"
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
        />

        <button disabled={loading}>
          {loading ? "Auditing..." : "Run audit"}
        </button>
      </form>

      <pre>{result}</pre>

      <style jsx>{`
        input,
        button {
          display: block;
          width: 100%;
          box-sizing: border-box;
          padding: 12px;
          margin: 12px 0;
          font-size: 16px;
        }

        pre {
          white-space: pre-wrap;
          overflow-x: auto;
          background: #f3f3f3;
          padding: 12px;
        }
      `}</style>
    </main>
  );
}

