import { NextResponse } from 'next/server';

/**
 * Server-side AI proxy — forwards requests to external AI providers using
 * server-side API keys when configured. This keeps keys out of the client
 * bundle and IndexedDB, and avoids sending them in request bodies.
 *
 * Supported endpoints:
 * - /api/ai/proxy/openai  → https://api.openai.com/v1
 * - /api/ai/proxy/deepseek → https://api.deepseek.com/v1
 * - /api/ai/proxy/gemini   → https://generativelanguage.googleapis.com/v1beta
 * - /api/ai/proxy/custom   → any OpenAI-compatible endpoint (passed in body)
 *
 * Server-side env vars (set in .env or .env.local):
 * - OPENAI_API_KEY
 * - DEEPSEEK_API_KEY
 * - GEMINI_API_KEY
 * - OPENROUTER_API_KEY
 * - AI_GATEWAY_API_KEY
 *
 * If a server-side key is configured, the proxy uses it and ignores the
 * client-supplied key. If no server key is set, it falls back to the
 * `apiKey` field in the request body (current client-side behavior).
 *
 * Body format (OpenAI-compatible endpoints):
 * {
 *   endpoint: string,     // full base URL, used when provider is 'custom'
 *   model: string,
 *   messages: [...],
 *   stream?: boolean,
 *   apiKey?: string,      // client key fallback
 *   ...other OpenAI params
 * }
 */

const PROVIDER_KEYS: Record<string, string | undefined> = {
  openai: process.env['OPENAI_API_KEY'],
  deepseek: process.env['DEEPSEEK_API_KEY'],
  gemini: process.env['GEMINI_API_KEY'],
  openrouter: process.env['OPENROUTER_API_KEY'],
  'ai-gateway': process.env['AI_GATEWAY_API_KEY'],
};

const PROVIDER_BASE_URLS: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  deepseek: 'https://api.deepseek.com/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta',
};

// Blocklist of host patterns that must never be proxied to.
// Covers cloud metadata endpoints, loopback, link-local, and private ranges.
const BLOCKED_HOST_PATTERNS: RegExp[] = [
  /^169\.254\./, // link-local (AWS/GCP/Azure IMDS)
  /^127\./, // loopback
  /^localhost$/i,
  /^10\./, // private class A
  /^172\.(1[6-9]|2\d|3[01])\./, // private class B
  /^192\.168\./, // private class C
  /^0\.0\.0\.0$/,
  /^::1$/i, // IPv6 loopback
  /^fc00:/i, // IPv6 unique local
  /^fe80:/i, // IPv6 link-local
  /^metadata\.google\.internal$/i, // GCP IMDS
];

function isEndpointSafe(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    // Must be HTTPS for external endpoints
    if (url.protocol !== 'https:') {
      return false;
    }
    const host = url.hostname.toLowerCase();
    for (const pattern of BLOCKED_HOST_PATTERNS) {
      if (pattern.test(host)) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const {
      provider,
      endpoint,
      model,
      messages,
      stream = false,
      apiKey: clientKey,
      ...rest
    } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array required' }, { status: 400 });
    }

    // Resolve the base URL
    let baseUrl: string;
    let useServerKey = false;

    if (provider && PROVIDER_BASE_URLS[provider]) {
      // Known provider with hardcoded URL — safe to use server key
      baseUrl = PROVIDER_BASE_URLS[provider]!;
      useServerKey = true;
    } else if (endpoint) {
      // Custom endpoint — validate strictly, never use server key
      if (!isEndpointSafe(endpoint)) {
        return NextResponse.json(
          { error: 'Invalid or unsafe endpoint URL. Use HTTPS and avoid internal addresses.' },
          { status: 400 },
        );
      }
      baseUrl = endpoint.replace(/\/+$/, '');
      useServerKey = false;
    } else {
      return NextResponse.json(
        { error: 'Either "provider" or "endpoint" is required.' },
        { status: 400 },
      );
    }

    // Resolve the API key: only use server-side key for known providers
    const apiKey = useServerKey
      ? (provider ? PROVIDER_KEYS[provider] : undefined) || clientKey
      : clientKey;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: useServerKey
            ? `No API key configured for provider "${provider}". Set the server-side environment variable or provide an API key in settings.`
            : 'No API key provided. Configure a provider or supply an API key in settings.',
        },
        { status: 401 },
      );
    }

    const url = `${baseUrl}/chat/completions`;

    const upstreamResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream,
        ...rest,
      }),
      redirect: 'manual',
    });

    // For streaming responses, pipe the stream through
    if (stream && upstreamResponse.ok) {
      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        headers: {
          'Content-Type': upstreamResponse.headers.get('Content-Type') || 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // For non-streaming, return the JSON response
    const data = await upstreamResponse.json();

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        {
          error: data.error?.message || data.error || `Upstream error: ${upstreamResponse.status}`,
        },
        { status: upstreamResponse.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `AI proxy error: ${errorMessage}` }, { status: 500 });
  }
}
