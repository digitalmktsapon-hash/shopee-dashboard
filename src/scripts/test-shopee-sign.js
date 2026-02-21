const crypto = require('crypto');

const PARTNER_ID = 1220489;
const PARTNER_KEY = 'shpk5a70594a584e4d6a425057654b586a6d624b504977416b69785075526d6e';
const REDIRECT = 'https://shopee-dashboard-rho.vercel.app/api/auth/shopee/callback';

const URLS = [
    'https://partner.test-stable.shopeemobile.com',
    'https://openplatform.sandbox.test-stable.shopee.sg'
];

async function testAuth(baseUrl, key, useHex = true) {
    const timestamp = Math.floor(Date.now() / 1000);
    const path = '/api/v2/shop/auth_partner';
    const baseString = `${PARTNER_ID}${path}${timestamp}`;

    let keyToUse = key.startsWith('shpk') ? key.slice(4) : key;
    let hmacKey = useHex ? Buffer.from(keyToUse, 'hex') : key;

    const sign = crypto.createHmac('sha256', hmacKey).update(baseString).digest('hex');
    const url = `${baseUrl}${path}?partner_id=${PARTNER_ID}&timestamp=${timestamp}&sign=${sign}&redirect=${encodeURIComponent(REDIRECT)}`;

    console.log(`Testing URL: ${baseUrl}`);
    console.log(`Key Variant: ${useHex ? 'Hex Decoded' : 'String'}`);
    console.log(`Base String: ${baseString}`);
    console.log(`Sign: ${sign}`);

    try {
        const res = await fetch(url);
        console.log('Response Status:', res.status);
        const data = await res.json();
        console.log('Response Body:', JSON.stringify(data));
    } catch (err) {
        console.log('Error:', err.message);
    }
    console.log('---');
}

async function run() {
    for (const url of URLS) {
        await testAuth(url, PARTNER_KEY, true);
        await testAuth(url, PARTNER_KEY, false);
    }
}

run();
