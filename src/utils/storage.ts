import { sql } from '@vercel/postgres';
import { ReportFile, ShopeeOrder, Platform } from './types';

// Initialize tables if they don't exist
export async function initDatabase() {
    try {
        await sql`
      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        order_count INTEGER DEFAULT 0,
        platform TEXT DEFAULT 'shopee',
        shop_name TEXT DEFAULT ''
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
    } catch (error) {
        console.error('Database Initialization Error:', error);
    }
}

export const addReport = async (
    name: string,
    orders: ShopeeOrder[],
    platform: Platform = 'shopee',
    shopName: string = ''
): Promise<ReportFile> => {
    const id = Date.now().toString();
    const uploadDate = new Date().toISOString();

    // Insert report
    await sql`
    INSERT INTO reports (id, name, upload_date, is_active, order_count, platform, shop_name)
    VALUES (${id}, ${name}, ${uploadDate}, TRUE, ${orders.length}, ${platform}, ${shopName})
  `;

    // Insert orders in batches or individually (Postgres jsonb is powerful)
    // For large reports, we might want to optimize this, but for now:
    for (const order of orders) {
        await sql`
      INSERT INTO orders (report_id, order_id, data)
      VALUES (${id}, ${order.orderId}, ${JSON.stringify(order)})
    `;
    }

    const newReport: ReportFile = {
        id,
        name,
        uploadDate,
        isActive: true,
        orders,
        orderCount: orders.length,
        platform,
        shopName,
    };

    return { ...newReport, orders: [] };
};

export const getReports = async (): Promise<ReportFile[]> => {
    const { rows } = await sql`
    SELECT id, name, upload_date as "uploadDate", is_active as "isActive", order_count as "orderCount", platform, shop_name as "shopName"
    FROM reports
    ORDER BY upload_date DESC
  `;
    return rows as ReportFile[];
};

export const getReportById = async (id: string): Promise<ReportFile | undefined> => {
    const { rows: reportRows } = await sql`
    SELECT id, name, upload_date as "uploadDate", is_active as "isActive", order_count as "orderCount", platform, shop_name as "shopName"
    FROM reports
    WHERE id = ${id}
  `;

    if (reportRows.length === 0) return undefined;

    const { rows: orderRows } = await sql`
    SELECT data
    FROM orders
    WHERE report_id = ${id}
  `;

    return {
        ...reportRows[0],
        orders: orderRows.map(r => r.data)
    } as ReportFile;
};

export const getAllOrders = async (platform?: string, shopName?: string): Promise<ShopeeOrder[]> => {
    if (platform && platform !== 'all') {
        const { rows } = await sql`
      SELECT o.data
      FROM orders o
      JOIN reports r ON o.report_id = r.id
      WHERE r.is_active = TRUE 
      AND r.platform = ${platform}
      AND r.shop_name = ${shopName || ''}
    `;
        return rows.map(r => r.data) as ShopeeOrder[];
    }

    const { rows } = await sql`
    SELECT o.data
    FROM orders o
    JOIN reports r ON o.report_id = r.id
    WHERE r.is_active = TRUE
  `;
    return rows.map(r => r.data) as ShopeeOrder[];
};

export const toggleReportStatus = async (id: string) => {
    await sql`
    UPDATE reports
    SET is_active = NOT is_active
    WHERE id = ${id}
  `;
};

export const deleteReport = async (id: string) => {
    // Cascading delete is handled by the DB foreign key constraint ON DELETE CASCADE
    await sql`
    DELETE FROM reports
    WHERE id = ${id}
  `;
};
