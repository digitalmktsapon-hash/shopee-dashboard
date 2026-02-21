import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken } from '../../../../../utils/shopeeAuth';
import fs from 'fs';
import path from 'path';

const TOKEN_FILE = path.join(process.cwd(), 'src/data/shopee_tokens.json');

/** Save tokens to local file (for development/sandbox testing) */
function saveTokens(tokens: object) {
    const dir = path.dirname(TOKEN_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
}

/**
 * GET /api/auth/shopee/callback
 * Shopee redirects here after shop owner authorizes the app.
 * URL will contain: ?code=ABC123&shop_id=987654
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const shopIdStr = searchParams.get('shop_id');

    if (!code || !shopIdStr) {
        return new NextResponse(
            `<html><body style="font-family:sans-serif;padding:40px;background:#0f0f0f;color:#fff">
                <h2 style="color:#f87171">❌ Authorization Failed</h2>
                <p>Missing <code>code</code> or <code>shop_id</code> in callback URL.</p>
                <p>Params received: ${JSON.stringify(Object.fromEntries(searchParams))}</p>
            </body></html>`,
            { status: 400, headers: { 'Content-Type': 'text/html' } }
        );
    }

    try {
        const shopId = Number(shopIdStr);
        const tokens = await exchangeCodeForToken(code, shopId);

        const tokenData = {
            ...tokens,
            obtained_at: Math.floor(Date.now() / 1000),
            expires_at: Math.floor(Date.now() / 1000) + (tokens.expire_in || 14400),
        };

        saveTokens(tokenData);

        // Redirect back to data-sources page with success
        return NextResponse.redirect(new URL('/data-sources?shopee_connected=1', req.url));

    } catch (err: any) {
        return new NextResponse(
            `<html><body style="font-family:sans-serif;padding:40px;background:#0f0f0f;color:#fff">
                <h2 style="color:#f87171">❌ Token Exchange Failed</h2>
                <pre style="background:#1a1a1a;padding:16px;border-radius:8px;color:#fca5a5">${err.message}</pre>
                <a href="/data-sources" style="color:#60a5fa">← Back to Data Sources</a>
            </body></html>`,
            { status: 500, headers: { 'Content-Type': 'text/html' } }
        );
    }
}
