export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

async function parseJson(response: Response) {
  const payload = await response.json();
  if (!response.ok || payload?.status === 'error') {
    const message = payload?.error?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return payload;
}

export async function apiGet<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      cache: 'no-store',
    });

    const payload = await parseJson(response);
    return payload.data as T;
  } catch (error) {
    // Re-throw with more context
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - API server may be unavailable');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
