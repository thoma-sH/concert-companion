// app/api/concertState/route.js
import { NextResponse } from 'next/server';

// In‑memory store (replace with database in production)
const concertStates = new Map();

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const concertId = searchParams.get('concertId');

  if (!concertId) {
    return NextResponse.json({ success: false, error: 'Missing concertId' }, { status: 400 });
  }

  const state = concertStates.get(concertId) || {
    effect: 'solid',
    color: '#38b6ff'
  };

  return NextResponse.json({ success: true, ...state });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { concertId, effect, color } = body;

    if (!concertId) {
      return NextResponse.json({ success: false, error: 'Missing concertId' }, { status: 400 });
    }

    const current = concertStates.get(concertId) || { effect: 'solid', color: '#38b6ff' };
    concertStates.set(concertId, {
      effect: effect !== undefined ? effect : current.effect,
      color: color !== undefined ? color : current.color,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in /api/concertState:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}