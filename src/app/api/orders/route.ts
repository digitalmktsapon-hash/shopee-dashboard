import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders, getReportById, getReports, initDatabase } from '@/utils/storage';
import { ShopeeOrder } from '@/utils/types';

export async function GET(request: NextRequest) {
    try {
        await initDatabase();
        const { searchParams } = new URL(request.url);
        const reportId = searchParams.get('report_id');
        const channelKey = searchParams.get('channel'); // e.g. "shopee_Miền Bắc" or "all" or null

        if (reportId) {
            const report = await getReportById(reportId);
            if (!report) return NextResponse.json([]);
            return NextResponse.json(report.orders || []);
        }

        // Get all orders from active reports
        let orders: ShopeeOrder[] = [];

        if (channelKey && channelKey !== 'all') {
            const [platform, ...shopNameParts] = channelKey.split('_');
            const shopName = shopNameParts.join('_');
            orders = await getAllOrders(platform, shopName);
        } else {
            orders = await getAllOrders();
        }

        return NextResponse.json(orders || []);
    } catch (error) {
        console.error('API Error in /api/orders:', error);
        return NextResponse.json([]); // Return empty array to prevent frontend crash
    }
}
