const { sql } = require('@vercel/postgres');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function migrate() {
    console.log('Starting migration...');
    try {
        // 1. Ensure tables exist (Basic init)
        await sql`
            CREATE TABLE IF NOT EXISTS reports (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                order_count INTEGER DEFAULT 0
            )
        `;
        await sql`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                report_id TEXT REFERENCES reports(id) ON DELETE CASCADE,
                order_id TEXT NOT NULL,
                data JSONB NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // 2. Add new columns for Phase 2
        console.log('Adding platform and shop_name columns...');
        await sql`ALTER TABLE reports ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'shopee'`;
        await sql`ALTER TABLE reports ADD COLUMN IF NOT EXISTS shop_name TEXT DEFAULT ''`;

        // 3. Ensure indices
        await sql`CREATE INDEX IF NOT EXISTS idx_orders_report_id ON orders(report_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id)`;

        console.log('Migration successful!');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
