import crypto from 'crypto';

const PARTNER_ID = Number(process.env.SHOPEE_PARTNER_ID);
const PARTNER_KEY = process.env.SHOPEE_PARTNER_KEY || '';
const BASE_URL = process.env.SHOPEE_BASE_URL || 'https://partner.test-stable.shopeemobile.com';
const REDIRECT_URL = process.env.SHOPEE_REDIRECT_URL || 'https://shopee-dashboard-rho.vercel.app/api/auth/shopee/callback';

/** Generate HMAC-SHA256 signature */
export function generateSignature(baseString: string): string {
    return crypto.createHmac('sha256', PARTNER_KEY).update(baseString).digest('hex');
}

/** Build the authorization URL to redirect shop owner to */
export function buildAuthUrl(): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const baseString = `${PARTNER_ID}/api/v2/shop/auth_partner${timestamp}`;
    const sign = generateSignature(baseString);

    const params = new URLSearchParams({
        partner_id: String(PARTNER_ID),
        timestamp: String(timestamp),
        sign,
        redirect: REDIRECT_URL,
    });

    return `${BASE_URL}/api/v2/shop/auth_partner?${params.toString()}`;
}

/** Exchange auth code for access_token */
export async function exchangeCodeForToken(code: string, shopId: number): Promise<{
    access_token: string;
    refresh_token: string;
    shop_id: number;
    expire_in: number;
}> {
    const timestamp = Math.floor(Date.now() / 1000);
    const path = '/api/v2/auth/token/get';
    const baseString = `${PARTNER_ID}${path}${timestamp}`;
    const sign = generateSignature(baseString);

    const body = {
        code,
        shop_id: shopId,
        partner_id: PARTNER_ID,
    };

    const url = `${BASE_URL}${path}?partner_id=${PARTNER_ID}&timestamp=${timestamp}&sign=${sign}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Token exchange failed: ${res.status} ${text}`);
    }

    const data = await res.json();
    if (data.error && data.error !== '') {
        throw new Error(`Shopee API error: ${data.error} - ${data.message}`);
    }

    return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        shop_id: data.shop_id || shopId,
        expire_in: data.expire_in,
    };
}

/** Refresh access token using refresh_token */
export async function refreshAccessToken(refreshToken: string, shopId: number): Promise<{
    access_token: string;
    refresh_token: string;
    expire_in: number;
}> {
    const timestamp = Math.floor(Date.now() / 1000);
    const path = '/api/v2/auth/access_token/get';
    const baseString = `${PARTNER_ID}${path}${timestamp}`;
    const sign = generateSignature(baseString);

    const body = {
        refresh_token: refreshToken,
        shop_id: shopId,
        partner_id: PARTNER_ID,
    };

    const url = `${BASE_URL}${path}?partner_id=${PARTNER_ID}&timestamp=${timestamp}&sign=${sign}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    const data = await res.json();
    if (data.error && data.error !== '') {
        throw new Error(`Token refresh failed: ${data.error} - ${data.message}`);
    }

    return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expire_in: data.expire_in,
    };
}

/** Build a signed API URL for any Shopee API endpoint */
export function buildApiUrl(path: string, accessToken: string, shopId: number, extraParams: Record<string, string> = {}): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const baseString = `${PARTNER_ID}${path}${timestamp}${accessToken}${shopId}`;
    const sign = generateSignature(baseString);

    const params = new URLSearchParams({
        partner_id: String(PARTNER_ID),
        timestamp: String(timestamp),
        access_token: accessToken,
        shop_id: String(shopId),
        sign,
        ...extraParams,
    });

    return `${BASE_URL}${path}?${params.toString()}`;
}
