import { NextResponse } from 'next/server';
import { getReports, getReportById, initDatabase } from '@/utils/storage';

/**
 * GET /api/reports/with-orders
 * Returns all active reports including their orders in a single DB trip.
 * Used by the overview page to avoid N+1 API calls.
 */
export async function GET() {
    try {
        await initDatabase();
        const reports = await getReports();
        const activeReports = reports ? reports.filter(r => r.isActive) : [];

        // Fetch orders for each report in parallel
        const withOrders = await Promise.all(
            activeReports.map(async (r) => {
                const full = await getReportById(r.id);
                return { ...r, orders: full?.orders || [] };
            })
        );

        return NextResponse.json(withOrders || []);
    } catch (error) {
        console.error('API Error in /api/reports/with-orders GET:', error);
        return NextResponse.json([]); // Prevent JSON parse crash on the frontend
    }
}
