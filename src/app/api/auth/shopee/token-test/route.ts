import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const PARTNER_ID = 1220489;
const KEY_FULL = 'shpk5a70594a584e4d6a425057654b586a6d624b504977416b69785075526d6e';
const KEY_STRIPPED = KEY_FULL.slice(4); // remove 'shpk' prefix
const KEY_HEX_DECODED = Buffer.from(KEY_STRIPPED, 'hex'); // treat hex as binary
const BASE_URL = 'https://partner.test-stable.shopeemobile.com';
const PATH = '/api/v2/auth/token/get';

function sign(key: string | Buffer, baseStr: string) {
    return crypto.createHmac('sha256', key).update(baseStr).digest('hex');
}

async function tryTokenExchange(code: string, shopId: number, key: string | Buffer, baseStrFn: (ts: number) => string, label: string) {
    const ts = Math.floor(Date.now() / 1000);
    const baseStr = baseStrFn(ts);
    const sig = sign(key, baseStr);
    const url = `${BASE_URL}${PATH}?partner_id=${PARTNER_ID}&timestamp=${ts}&sign=${sig}`;

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, shop_id: shopId, partner_id: PARTNER_ID }),
        });
        const data = await res.json();
        return { label, base_string: baseStr, sign: sig, status: res.status, result: data };
    } catch (e: any) {
        return { label, base_string: baseStr, sign: sig, status: 0, result: { error: e.message } };
    }
}

/**
 * GET /api/auth/shopee/token-test?code=xxx&shop_id=yyy
 * Tries all 6 key format variants for token exchange with a real code+shop_id
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const shopIdStr = searchParams.get('shop_id');

    if (!code || !shopIdStr) {
        return NextResponse.json({
            error: 'Missing code or shop_id',
            usage: '/api/auth/shopee/token-test?code=YOUR_CODE&shop_id=YOUR_SHOP_ID'
        }, { status: 400 });
    }

    const shopId = Number(shopIdStr);

    const variants = [
        { label: '1_full_key_with_slash', key: KEY_FULL, fn: (ts: number) => `${PARTNER_ID}/api/v2/auth/token/get${ts}` },
        { label: '2_full_key_no_slash', key: KEY_FULL, fn: (ts: number) => `${PARTNER_ID}api/v2/auth/token/get${ts}` },
        { label: '3_stripped_key_with_slash', key: KEY_STRIPPED, fn: (ts: number) => `${PARTNER_ID}/api/v2/auth/token/get${ts}` },
        { label: '4_stripped_key_no_slash', key: KEY_STRIPPED, fn: (ts: number) => `${PARTNER_ID}api/v2/auth/token/get${ts}` },
        { label: '5_hex_decoded_key_with_slash', key: KEY_HEX_DECODED, fn: (ts: number) => `${PARTNER_ID}/api/v2/auth/token/get${ts}` },
        { label: '6_hex_decoded_key_no_slash', key: KEY_HEX_DECODED, fn: (ts: number) => `${PARTNER_ID}api/v2/auth/token/get${ts}` },
    ];

    // Try each variant sequentially and collect results
    const results = [];
    for (const v of variants) {
        const result = await tryTokenExchange(code, shopId, v.key, v.fn, v.label);
        results.push(result);
        // Stop early if one succeeds
        if (!result.result?.error || result.result?.access_token) {
            results.push({ note: `✅ SUCCESS on variant: ${v.label}` });
            break;
        }
    }

    return NextResponse.json({ partner_id: PARTNER_ID, code_preview: code.substring(0, 8) + '...', shop_id: shopId, results });
}
