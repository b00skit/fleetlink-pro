import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token is required' }, { status: 400 });
    }

    const adminToken = process.env.ADMIN_TOKEN;

    if (!adminToken) {
        console.error('ADMIN_TOKEN is not set in environment variables.');
        return NextResponse.json({ success: false, error: 'Server configuration error.' }, { status: 500 });
    }

    if (token === adminToken) {
      // In a real production app, you would generate a session token (e.g., a JWT)
      // and return it to the client to be used for subsequent authenticated requests.
      // For simplicity here, we'll just confirm success.
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Admin authentication error:', error);
    return NextResponse.json({ success: false, error: 'An internal server error occurred.' }, { status: 500 });
  }
}