import { NextResponse } from 'next/server';

const PROVIDER_KEYS: Record<string, string | undefined> = {
  openai: process.env['OPENAI_API_KEY'], deepseek: process.env['DEEPSEEK_API_KEY'],
  gemini: process.env['GEMINI_API_KEY'], openrouter: process.env['OPENROUTER_API_KEY'],
  'ai-gateway': process.env['AI_GATEWAY_API_KEY'],
};
const PROVIDER_BASE_URLS: Record<string, string> = {
  openai: 'https://api.openai.com/v1', deepseek: 'https://api.deepseek.com/v1',
  openrouter: 'https://openrouter.ai/api/v1', gemini: 'https://generativelanguage.googleapis.com/v1beta',
};
const BLOCKED_HOSTS = [/^169\.254\./, /^127\./, /^localhost$/i, /^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./, /^0\.0\.0\.0$/, /^::1$/i, /^fc00:/i, /^fe80:/i, /^metadata\.google\.internal$/i];

function isSafe(url: string): boolean {
  try { const u = new URL(url); if (u.protocol !== 'https:') return false;
    for (const p of BLOCKED_HOSTS) if (p.test(u.hostname)) return false; return true; }
  catch { return false; }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const { provider, endpoint, model, messages, stream = false, apiKey: clientKey, ...rest } = await req.json();
    if (!messages || !Array.isArray(messages)) return NextResponse.json({ error: 'Messages array required' }, { status: 400 });

    let baseUrl: string; let useServerKey = false;
    if (provider && PROVIDER_BASE_URLS[provider]) { baseUrl = PROVIDER_BASE_URLS[provider]!; useServerKey = true; }
    else if (endpoint) { if (!isSafe(endpoint)) return NextResponse.json({ error: 'Unsafe endpoint' }, { status: 400 }); baseUrl = endpoint.replace(/\/+$/, ''); }
    else return NextResponse.json({ error: 'provider or endpoint required' }, { status: 400 });

    const apiKey = useServerKey ? (provider ? PROVIDER_KEYS[provider] : undefined) || clientKey : clientKey;
    if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 401 });

    const r = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages, stream, ...rest }), redirect: 'manual',
    });

    if (stream && r.ok) return new Response(r.body, { status: r.status, headers: { 'Content-Type': r.headers.get('Content-Type') || 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } });

    const data = await r.json();
    if (!r.ok) return NextResponse.json({ error: data.error?.message || `Upstream error: ${r.status}` }, { status: r.status });
    return NextResponse.json(data);
  } catch (e) { return NextResponse.json({ error: `AI proxy error: ${(e as Error).message}` }, { status: 500 }); }
}
