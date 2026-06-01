import { getAccessToken } from './access';

export const fetchWithTimeout = (url: string, options: RequestInit = {}, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort('Request timed out'), timeout);

  return fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => clearTimeout(id));
};

export const fetchWithAuth = async (url: string, options: RequestInit) => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorMsg = response.statusText || 'Request failed';
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorData.message || errorMsg;
    } catch {
      // Response body might not be JSON (e.g. HTML error page)
      const text = await response.text().catch(() => '');
      if (text) errorMsg = text.slice(0, 200);
    }
    console.error(`fetchWithAuth failed (${response.status}):`, errorMsg);
    throw new Error(errorMsg);
  }

  return response;
};
