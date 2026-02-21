import { NextResponse } from 'next/server';
import { buildAuthUrl } from '../../../../../utils/shopeeAuth';

/**
 * GET /api/auth/shopee/authorize
 * Returns the Shopee authorization URL to redirect the user to.
 */
export async function GET() {
    try {
        const authUrl = buildAuthUrl();
        return NextResponse.json({ url: authUrl });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
