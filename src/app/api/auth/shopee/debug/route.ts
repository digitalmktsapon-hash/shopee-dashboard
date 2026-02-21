import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
    const PARTNER_ID = Number(process.env.SHOPEE_PARTNER_ID) || 1220489;
    const PARTNER_KEY_FULL = process.env.SHOPEE_PARTNER_KEY || 'shpk5a70594a584e4d6a425057654b586a6d624b504977416b69785075526d6e';
    // Strip shpk prefix if present
    const PARTNER_KEY_STRIPPED = PARTNER_KEY_FULL.startsWith('shpk') ? PARTNER_KEY_FULL.slice(4) : PARTNER_KEY_FULL;
    const REDIRECT_URL = process.env.SHOPEE_REDIRECT_URL || 'https://shopee-dashboard-rho.vercel.app/api/auth/shopee/callback';

    const timestamp = Math.floor(Date.now() / 1000);
    const path = '/api/v2/shop/auth_partner';
    const baseString = `${PARTNER_ID}${path}${timestamp}`;

    const signWithFullKey = crypto.createHmac('sha256', PARTNER_KEY_FULL).update(baseString).digest('hex');
    const signWithStrippedKey = crypto.createHmac('sha256', PARTNER_KEY_STRIPPED).update(baseString).digest('hex');

    return NextResponse.json({
        partner_id: PARTNER_ID,
        key_length_full: PARTNER_KEY_FULL.length,
        key_length_stripped: PARTNER_KEY_STRIPPED.length,
        key_from_env: !!process.env.SHOPEE_PARTNER_KEY,
        base_string: baseString,
        sign_full_key: signWithFullKey,
        sign_stripped_key: signWithStrippedKey,
        url_full_key: `https://partner.test-stable.shopeemobile.com${path}?partner_id=${PARTNER_ID}&timestamp=${timestamp}&sign=${signWithFullKey}&redirect=${encodeURIComponent(REDIRECT_URL)}`,
        url_stripped_key: `https://partner.test-stable.shopeemobile.com${path}?partner_id=${PARTNER_ID}&timestamp=${timestamp}&sign=${signWithStrippedKey}&redirect=${encodeURIComponent(REDIRECT_URL)}`,
    });
}
