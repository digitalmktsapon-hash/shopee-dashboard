import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * GET /api/auth/shopee/debug
 * Shows what values are being used for signature computation (safe - no full key exposed)
 */
export async function GET() {
    const PARTNER_ID = Number(process.env.SHOPEE_PARTNER_ID) || 1220489;
    const PARTNER_KEY = process.env.SHOPEE_PARTNER_KEY || 'shpk5a70594a584e4d6a425057654b586a6d624b504977416b69785075526d6e';
    const REDIRECT_URL = process.env.SHOPEE_REDIRECT_URL || 'https://shopee-dashboard-rho.vercel.app/api/auth/shopee/callback';

    const timestamp = Math.floor(Date.now() / 1000);
    const path = '/api/v2/shop/auth_partner';
    const baseString = `${PARTNER_ID}${path}${timestamp}`;
    const sign = crypto.createHmac('sha256', PARTNER_KEY).update(baseString).digest('hex');

    return NextResponse.json({
        partner_id: PARTNER_ID,
        partner_id_type: typeof PARTNER_ID,
        key_length: PARTNER_KEY.length,
        key_prefix: PARTNER_KEY.substring(0, 8) + '***',
        key_from_env: !!process.env.SHOPEE_PARTNER_KEY,
        redirect_url: REDIRECT_URL,
        timestamp,
        base_string: baseString,
        sign,
        full_auth_url: `https://partner.test-stable.shopeemobile.com${path}?partner_id=${PARTNER_ID}&timestamp=${timestamp}&sign=${sign}&redirect=${encodeURIComponent(REDIRECT_URL)}`,
    });
}
