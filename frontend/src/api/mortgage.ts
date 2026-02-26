import { getToken } from 'firebase/app-check';
import { appCheck } from '../firebase';
import type { CompareRequest, CompareResponse } from "../types/mortgage";

const API_URL = import.meta.env.VITE_API_URL || "/api";

export async function compareMortgages(
  request: CompareRequest
): Promise<CompareResponse> {
  // Get App Check token
  let appCheckToken: string | undefined;
  try {
    const tokenResult = await getToken(appCheck, /* forceRefresh */ false);
    appCheckToken = tokenResult.token;
  } catch (error) {
    console.error('Failed to get App Check token:', error);
    // Continue without token - backend will reject
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (appCheckToken) {
    headers['X-Firebase-AppCheck'] = appCheckToken;
  }

  const res = await fetch(`${API_URL}/compare`, {
    method: "POST",
    headers,
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}
