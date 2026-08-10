"use client";

import { useState } from "react";

type Report = {
  audited_business: {
    name: string;
    appears: boolean;
    position: number | null;
  };
  recommendations: {
    position: number;
    name: string;
    reason: string;
    sources: string[];
  }[];
  limitations: string[];
};

export default function Home() {
  const [business, setBusiness] = useState("");
  const [city, setCity] = useState("Plano, Texas");
  const [intent, setIntent] = useState("emergency AC repair");
  const [report, setReport] = useState<Report | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function runAudit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setReport(null);
    setMessage("");

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: business,
          city,
          intent
        })
      });

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        setMessage("The audit could not be completed.");
        return;
      }

      setReport(data.report);
    } catch {
      setMessage("The audit could not be completed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <h1>Beacon Audit</h1>

      <p>Check how a local business appears for a customer search.</p>

      <form onSubmit={runAudit}>
        <label>
          Business name
          <input
            value={business}
            onChange={(event) => setBusiness(event.target.value)}
            required
          />
        </label>

        <label>
          City
          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            required
          />
        </label>

        <label>
          Customer intent
          <input
            value={intent}
            onChange={(event) => setIntent(event.target.value)}
            required
          />
        </label>

        <button disabled={loading}>
          {loading ? "Running audit..." : "Run audit"}
        </button>
      </form>

      {message && <p className="error">{message}</p>}

      {report && (
        <section>
          <h2>Audit result</h2>

          <p>
            <strong>{report.audited_business.name}</strong>{" "}
            {report.audited_business.appears
              ? `appeared in position ${report.audited_business.position}.`
              : "was not found in this response."}
          </p>

          <h2>Recommended businesses</h2>

          {report.recommendations.length === 0 && (
            <p>No verified recommendations were returned.</p>
          )}

          {report.recommendations.map((item) => (
            <article key={`${item.position}-${item.name}`}>
              <h3>
                {item.position}. {item.name}
              </h3>

              <p>{item.reason}</p>

              {item.sources.length > 0 && (
                <div>
                  <strong>Sources</strong>

                  {item.sources.map((source) => (
                    <a
                      key={source}
                      href={source}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {source}
                    </a>
                  ))}
                </div>
              )}
            </article>
          ))}

          {report.limitations.length > 0 && (
            <div>
              <h2>Limitations</h2>

              {report.limitations.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          )}
        </section>
      )}

      <style jsx>{`
        .page {
          max-width: 640px;
          margin: 0 auto;
          padding: 24px;
          font-family: Arial, sans-serif;
        }

        label {
          display: block;
          margin: 16px 0;
        }

        input,
        button {
          display: block;
          width: 100%;
          box-sizing: border-box;
          padding: 12px;
          margin-top: 6px;
          font-size: 16px;
        }

        button {
          color: white;
          background: #111;
          border: 0;
          cursor: pointer;
        }

        article {
          margin: 16px 0;
          padding: 16px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }

        a {
          display: block;
          margin-top: 6px;
          overflow-wrap: anywhere;
        }

        .error {
          color: #a00;
        }
      `}</style>
    </main>
  );
}
