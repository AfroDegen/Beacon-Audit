export async function POST(request: Request) {
  const body = await request.json();
  const key = process.env.GEMINI_API_KEY;

  if (!key) {
    return Response.json({ error: "Missing Gemini API key" }, { status: 500 });
  }

  if (!body.city || !body.category || !body.intent) {
    return Response.json(
      { error: "City, category, and intent are required" },
      { status: 400 }
    );
  }

  const prompt = `
Recommend up to five ${body.category} businesses for ${body.intent} in ${body.city}.

Business being audited: ${body.business_name || "Not provided"}

Return valid JSON only:
{
  "audited_business": {
    "name": "${body.business_name || "Not provided"}",
    "appears": false,
    "position": null
  },
  "recommendations": [
    {
      "position": 1,
      "name": "Business name",
      "reason": "Why it was recommended",
      "sources": ["URL"]
    }
  ]
}

Do not invent facts. Do not claim this is an official Google ranking.
`;

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
    
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    return Response.json(
      { error: data.error?.message || "Gemini request failed" },
      { status: response.status }
    );
  }

  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  const clean = text
    .replace(/^```json\s*/, "")
    .replace(/\s*```$/, "")
    .trim();

  let result;

  try {
    result = JSON.parse(clean);
  } catch {
    result = { raw_response: text };
  }

  return Response.json({
    engine: "gemini",
    result,
    grounding_metadata:
      data.candidates?.[0]?.groundingMetadata || null
  });
}
