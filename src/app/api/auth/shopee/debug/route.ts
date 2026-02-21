import { NextResponse } from 'next/server';
import crypto from 'crypto';

function hmac(key: string, msg: string) {
    return crypto.createHmac('sha256', key).update(msg).digest('hex');
}

export async function GET() {
    const PARTNER_ID = 1220489;
    const KEY_FULL = process.env.SHOPEE_PARTNER_KEY || 'shpk5a70594a584e4d6a425057654b586a6d624b504977416b69785075526d6e';
    const KEY_STRIPPED = KEY_FULL.startsWith('shpk') ? KEY_FULL.slice(4) : KEY_FULL;
    const REDIRECT = 'https://shopee-dashboard-rho.vercel.app/api/auth/shopee/callback';
    const BASE = 'https://partner.test-stable.shopeemobile.com';
    const ts = Math.floor(Date.now() / 1000);

    const variants = [
        { label: 'full_key + /path', key: KEY_FULL, base: `${PARTNER_ID}/api/v2/shop/auth_partner${ts}` },
        { label: 'full_key + path_noslash', key: KEY_FULL, base: `${PARTNER_ID}api/v2/shop/auth_partner${ts}` },
        { label: 'stripped_key + /path', key: KEY_STRIPPED, base: `${PARTNER_ID}/api/v2/shop/auth_partner${ts}` },
        { label: 'stripped_key + path_noslash', key: KEY_STRIPPED, base: `${PARTNER_ID}api/v2/shop/auth_partner${ts}` },
    ];

    const results = variants.map(v => {
        const sign = hmac(v.key, v.base);
        return {
            label: v.label,
            base_string: v.base,
            sign,
            test_url: `${BASE}/api/v2/shop/auth_partner?partner_id=${PARTNER_ID}&timestamp=${ts}&sign=${sign}&redirect=${encodeURIComponent(REDIRECT)}`,
        };
    });

    return NextResponse.json({ timestamp: ts, variants: results });
}
