import { NextRequest, NextResponse } from 'next/server';

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const ALCHEMY_NETWORK = process.env.ALCHEMY_NETWORK || 'eth-sepolia';

export async function POST(request: NextRequest) {
  if (!ALCHEMY_API_KEY) {
    return NextResponse.json(
      { error: 'ALCHEMY_API_KEY not configured on server' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { method, params } = body;

    const response = await fetch(
      `https://${ALCHEMY_NETWORK}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method,
          params: params || [],
        }),
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to call Alchemy API' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const method = searchParams.get('method');
  const params = searchParams.get('params');

  if (!method) {
    return NextResponse.json(
      { error: 'Method parameter required' },
      { status: 400 }
    );
  }

  if (!ALCHEMY_API_KEY) {
    return NextResponse.json(
      { error: 'ALCHEMY_API_KEY not configured on server' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://${ALCHEMY_NETWORK}.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method,
          params: params ? JSON.parse(params) : [],
        }),
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to call Alchemy API' },
      { status: 500 }
    );
  }
}