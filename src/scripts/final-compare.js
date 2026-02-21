const crypto = require('crypto');

const PARTNER_ID = 1220489;
const PARTNER_KEY = 'shpk5a70594a584e4d6a425057654b586a6d624b504977416b69785075526d6e';
const REDIRECT = 'https://shopee-dashboard-rho.vercel.app/api/auth/shopee/callback';
const BASE_URL = 'https://openplatform.sandbox.test-stable.shopee.sg';

async function test(useHex) {
    const timestamp = Math.floor(Date.now() / 1000);
    const path = '/api/v2/shop/auth_partner';
    const baseString = `${PARTNER_ID}${path}${timestamp}`;

    let keyToUse = PARTNER_KEY.startsWith('shpk') ? PARTNER_KEY.slice(4) : PARTNER_KEY;
    let hmacKey = useHex ? Buffer.from(keyToUse, 'hex') : PARTNER_KEY;

    const sign = crypto.createHmac('sha256', hmacKey).update(baseString).digest('hex');
    const url = `${BASE_URL}${path}?partner_id=${PARTNER_ID}&timestamp=${timestamp}&sign=${sign}&redirect=${encodeURIComponent(REDIRECT)}`;

    const res = await fetch(url);
    const body = await res.text();
    const isWrongSign = body.includes('Wrong sign');

    console.log(`Variant: ${useHex ? 'Hex' : 'String'}`);
    console.log(`Status: ${res.status}`);
    console.log(`Is Wrong Sign Error: ${isWrongSign}`);
}

async function run() {
    await test(true);
    await test(false);
}

run();
