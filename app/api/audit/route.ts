type AuditRequest = {
  business_name: string;
  city: string;
  intent: string;
};

type Recommendation = {
  position: number;
  name: string;
  reason: string;
  sources: string[];
};

function validUrl(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^https?:\/\//i.test(value)
  );
}

function safeText(value: unknown): string {
  return typeof value === "string" ? value.slice(0, 500) : "";
}

function safeReport(value: any) {
  return {
    audited_business: {
      name: safeText(value?.audited_business?.name),
      appears: Boolean(value?.audited_business?.appears),
      position:
        typeof value?.audited_business?.position === "number"
          ? value.audited_business.position
          : null
    },
    recommendations: Array.isArray(value?.recommendations)
      ? value.recommendations.slice(0, 5).map(
          (item: any, index: number): Recommendation => ({
            position: index + 1,
            name: safeText(item?.name),
            reason: safeText(item?.reason),
            sources: Array.isArray(item?.sources)
              ? item.sources.filter(validUrl).slice(0, 5)
              : []
          })
        )
      : [],
    limitations: Array.isArray(value?.limitations)
      ? value.limitations
          .filter((item: unknown) => typeof item === "string")
          .slice(0, 3)
          .map((item: string) => item.slice(0, 300))
      : []
  };
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as Partial<AuditRequest>;
    const key = process.env.GEMINI_API_KEY;

    if (!key) {
      return Response.json(
        { status: "failed", code: "AUDIT_UNAVAILABLE" },
        { status: 503 }
      );
    }

    if (!input.city || !input.intent) {
      return Response.json(
        { status: "failed", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    const prompt = `
Audit this local search request:

Business: ${String(input.business_name || "Not provided").slice(0, 150)}
City: ${input.city.slice(0, 100)}
Intent: ${input.intent.slice(0, 150)}

Return JSON only:
{
  "audited_business": {
    "name": "string",
    "appears": false,
    "position": null
  },
  "recommendations": [
    {
      "name": "string",
      "reason": "string",
      "sources": ["https://example.com"]
    }
  ],
  "limitations": ["string"]
}

Return no more than five recommendations.
Do not invent facts or URLs.
Do not claim this is an official search ranking.
`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": key
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }]
        }),
        signal: controller.signal,
        cache: "no-store"
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      console.error("Gemini request failed:", response.status);
      return Response.json(
        { status: "failed", code: "AUDIT_UNAVAILABLE" },
        { status: 503 }
      );
    }

    const data = await response.json();
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const clean = text
      .replace(/^```json\s*/, "")
      .replace(/\s*```$/, "")
      .trim();

    const report = safeReport(JSON.parse(clean));

    return Response.json({
      status: "success",
      report
    });
  } catch (error) {
    console.error("Private audit error:", error);

    return Response.json(
      { status: "failed", code: "AUDIT_UNAVAILABLE" },
      { status: 503 }
    );
  }
}
