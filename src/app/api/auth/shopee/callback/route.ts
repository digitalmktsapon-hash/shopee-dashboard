import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken } from '../../../../../utils/shopeeAuth';
import fs from 'fs';
import path from 'path';

const TOKEN_FILE = path.join(process.cwd(), 'src/data/shopee_tokens.json');

function saveTokens(tokens: object) {
    const dir = path.dirname(TOKEN_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
}

/**
 * GET /api/auth/shopee/callback
 * Shopee redirects here after authorization.
 * URL may contain: ?code=ABC123&shop_id=987654
 * OR for main/test accounts: ?code=ABC123&main_account_id=111222
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    // Shopee returns shop_id for shops, main_account_id for main/test accounts
    const shopIdStr = searchParams.get('shop_id');
    const mainAccountIdStr = searchParams.get('main_account_id');
    const allParams = Object.fromEntries(searchParams);

    if (!code) {
        return new NextResponse(
            `<html><body style="font-family:sans-serif;padding:40px;background:#0f0f0f;color:#fff">
                <h2 style="color:#f87171">❌ Authorization Failed</h2>
                <p>Missing <code>code</code> in callback URL.</p>
                <p>All params received: <pre style="background:#1a1a1a;padding:12px;border-radius:8px;color:#a3e635">${JSON.stringify(allParams, null, 2)}</pre></p>
            </body></html>`,
            { status: 400, headers: { 'Content-Type': 'text/html' } }
        );
    }

    // Use shop_id if available, otherwise main_account_id
    const shopId = shopIdStr ? Number(shopIdStr) : 0;
    const mainAccountId = mainAccountIdStr ? Number(mainAccountIdStr) : 0;
    const isMainAccount = !shopIdStr && !!mainAccountIdStr;

    try {
        const tokens = await exchangeCodeForToken(code, shopId, mainAccountId, isMainAccount);

        const tokenData = {
            ...tokens,
            is_main_account: isMainAccount,
            obtained_at: Math.floor(Date.now() / 1000),
            expires_at: Math.floor(Date.now() / 1000) + (tokens.expire_in || 14400),
            all_params: allParams,
        };

        saveTokens(tokenData);

        return NextResponse.redirect(new URL('/data-sources?shopee_connected=1', req.url));

    } catch (err: any) {
        return new NextResponse(
            `<html><body style="font-family:sans-serif;padding:40px;background:#0f0f0f;color:#fff">
                <h2 style="color:#f87171">❌ Token Exchange Failed</h2>
                <p>Params: <code>${JSON.stringify(allParams)}</code></p>
                <pre style="background:#1a1a1a;padding:16px;border-radius:8px;color:#fca5a5">${err.message}</pre>
                <a href="/data-sources" style="color:#60a5fa">← Back to Data Sources</a>
            </body></html>`,
            { status: 500, headers: { 'Content-Type': 'text/html' } }
        );
    }
}
