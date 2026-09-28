import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const pythonUrl = process.env.PYTHON_BACKEND_URL;
  let pythonHealth: any = null;

  if (pythonUrl) {
    try {
      const target = `${pythonUrl.replace(/\/$/, '')}/health`;
      const res = await fetch(target, {
        headers: { 'User-Agent': 'PixelShrink-NextJs-HealthCheck/1.0' },
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        pythonHealth = await res.json();
      } else {
        pythonHealth = { status: 'error', statusCode: res.status };
      }
    } catch (err: any) {
      pythonHealth = { status: 'offline', error: err.message };
    }
  }

  const responseData = {
    status: 'ok',
    service: 'PixelShrink Next.js Web App',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    pythonBackend: pythonUrl
      ? {
          configured: true,
          url: pythonUrl,
          health: pythonHealth,
        }
      : {
          configured: false,
          mode: 'embedded-local-engine',
          note: 'Set PYTHON_BACKEND_URL to connect separated external Python backend',
        },
  };

  return NextResponse.json(responseData, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
