import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken } from '../../../../../utils/shopeeAuth';

/**
 * GET /api/auth/shopee/callback
 * Shopee redirects here after authorization.
 * Stores tokens in HttpOnly cookies (Vercel has a read-only filesystem).
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const shopIdStr = searchParams.get('shop_id');
    const mainAccountIdStr = searchParams.get('main_account_id');
    const allParams = Object.fromEntries(searchParams);

    if (!code) {
        return new NextResponse(
            `<html><body style="font-family:sans-serif;padding:40px;background:#0f0f0f;color:#fff">
                <h2 style="color:#f87171">❌ Authorization Failed</h2>
                <p>Missing <code>code</code> in callback URL.</p>
                <pre style="background:#1a1a1a;padding:12px;border-radius:8px;color:#a3e635">${JSON.stringify(allParams, null, 2)}</pre>
            </body></html>`,
            { status: 400, headers: { 'Content-Type': 'text/html' } }
        );
    }

    const shopId = shopIdStr ? Number(shopIdStr) : 0;
    const mainAccountId = mainAccountIdStr ? Number(mainAccountIdStr) : 0;
    const isMainAccount = !shopIdStr && !!mainAccountIdStr;

    try {
        const tokens = await exchangeCodeForToken(code, shopId, mainAccountId, isMainAccount);
        const expiresAt = Math.floor(Date.now() / 1000) + (tokens.expire_in || 14400);

        // Store tokens in HttpOnly cookies (no filesystem writes on Vercel)
        const redirectUrl = new URL('/data-sources?shopee_connected=1', req.url);
        const res = NextResponse.redirect(redirectUrl);

        const cookieOptions = {
            httpOnly: true,
            secure: true,
            sameSite: 'lax' as const,
            maxAge: tokens.expire_in || 14400,
            path: '/',
        };

        res.cookies.set('shopee_access_token', tokens.access_token, cookieOptions);
        res.cookies.set('shopee_refresh_token', tokens.refresh_token, cookieOptions);
        res.cookies.set('shopee_shop_id', String(tokens.shop_id || shopId || mainAccountId), cookieOptions);
        // shopee_expires_at is readable by JS (for UI to show connection status)
        res.cookies.set('shopee_expires_at', String(expiresAt), { ...cookieOptions, httpOnly: false });

        return res;

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
