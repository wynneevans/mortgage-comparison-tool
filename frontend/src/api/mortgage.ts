import type { CompareRequest, CompareResponse } from "../types/mortgage";

export async function compareMortgages(
  request: CompareRequest
): Promise<CompareResponse> {
  const res = await fetch("/api/compare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}
