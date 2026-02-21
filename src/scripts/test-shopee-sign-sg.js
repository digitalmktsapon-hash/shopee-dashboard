const crypto = require('crypto');

const PARTNER_ID = 1220489;
const PARTNER_KEY = 'shpk5a70594a584e4d6a425057654b586a6d624b504977416b69785075526d6e';
const REDIRECT = 'https://shopee-dashboard-rho.vercel.app/api/auth/shopee/callback';
const BASE_URL = 'https://openplatform.sandbox.test-stable.shopee.sg';

async function testAuth(useHex) {
    const timestamp = Math.floor(Date.now() / 1000);
    const path = '/api/v2/shop/auth_partner';
    const baseString = `${PARTNER_ID}${path}${timestamp}`;

    let keyToUse = PARTNER_KEY.startsWith('shpk') ? PARTNER_KEY.slice(4) : PARTNER_KEY;
    let hmacKey = useHex ? Buffer.from(keyToUse, 'hex') : PARTNER_KEY; // Use full key for string variant

    const sign = crypto.createHmac('sha256', hmacKey).update(baseString).digest('hex');
    const url = `${BASE_URL}${path}?partner_id=${PARTNER_ID}&timestamp=${timestamp}&sign=${sign}&redirect=${encodeURIComponent(REDIRECT)}`;

    console.log(`Key Variant: ${useHex ? 'Hex Decoded' : 'String (Full Key)'}`);
    console.log(`URL: ${url}`);

    try {
        const res = await fetch(url);
        console.log('Status:', res.status);
    } catch (err) {
        console.log('Error:', err.message);
    }
}

async function run() {
    await testAuth(true);
    console.log('---');
    await testAuth(false);
}

run();
