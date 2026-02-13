import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const url = `${API_BASE}/api/v1/restaurants/${params.id}`;

    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: process.env.NODE_ENV === 'production' ? 60 : 0 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Backend responded with ${res.status}` },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('[BFF] /api/restaurants/[id] error:', err);
    return NextResponse.json(
      { error: 'Impossible de contacter le serveur backend.' },
      { status: 502 },
    );
  }
}
