import { NextRequest, NextResponse } from 'next/server';

const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_GATEWAY = process.env.PINATA_GATEWAY || 'https://ipfs.io/ipfs/';

export async function POST(request: NextRequest) {
  if (!PINATA_JWT) {
    return NextResponse.json(
      { error: 'PINATA_JWT not configured on server' },
      { status: 500 }
    );
  }

  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      const { pinataContent, pinataMetadata } = body;

      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PINATA_JWT}`,
        },
        body: JSON.stringify({
          pinataContent,
          pinataMetadata,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Pinata API error:', data);
        return NextResponse.json(
          { error: data.error || data.message || 'Failed to upload to IPFS' },
          { status: response.status }
        );
      }

      return NextResponse.json({
        ...data,
        gatewayUrl: `${PINATA_GATEWAY}${data.IpfsHash}`
      });
    } else {
      const formData = await request.formData();

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PINATA_JWT}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Pinata file upload error:', data);
        return NextResponse.json(
          { error: data.error || data.message || 'Failed to upload to IPFS' },
          { status: response.status }
        );
      }

      return NextResponse.json({
        ...data,
        gatewayUrl: `${PINATA_GATEWAY}${data.IpfsHash}`
      });
    }
  } catch (error) {
    console.error('Pinata route error:', error);
    return NextResponse.json(
      { error: 'Failed to upload to IPFS' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hash = searchParams.get('hash');

  if (!hash) {
    return NextResponse.json(
      { error: 'Hash parameter required' },
      { status: 400 }
    );
  }

  return NextResponse.redirect(`${PINATA_GATEWAY}${hash}`);
}