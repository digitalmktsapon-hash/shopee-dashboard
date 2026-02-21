const { sql } = require('@vercel/postgres');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function testConnection() {
    console.log('Testing connection to:', process.env.POSTGRES_HOST);
    try {
        console.log('Initializing database...');
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
        await sql`CREATE INDEX IF NOT EXISTS idx_orders_report_id ON orders(report_id)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id)`;

        const { rows } = await sql`SELECT NOW()`;
        console.log('Connection successful! Current time from DB:', rows[0].now);

        const { rows: tableRows } = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        console.log('Available tables:', tableRows.map(r => r.table_name).join(', '));

    } catch (error) {
        console.error('Database connection failed:', error);
    }
}

testConnection();
