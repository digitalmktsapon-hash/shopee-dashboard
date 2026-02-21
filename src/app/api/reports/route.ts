import { NextResponse } from 'next/server';
import { getReports, addReport, deleteReport, toggleReportStatus, initDatabase } from '@/utils/storage';
import { Platform, ShopeeOrder } from '@/utils/types';

export async function GET() {
    try {
        await initDatabase();
        const reports = await getReports();
        return NextResponse.json(reports || []);
    } catch (error) {
        console.error('API Error in /api/reports GET:', error);
        return NextResponse.json([]); // Prevent JSON crash on frontend
    }
}

export async function POST(request: Request) {
    try {
        await initDatabase();
        const body = await request.json();
        const { name, orders, platform, shopName } = body;

        if (!name || !orders) {
            return NextResponse.json({ error: 'Missing name or orders' }, { status: 400 });
        }

        const newReport = await addReport(
            name,
            orders as ShopeeOrder[],
            (platform as Platform) || 'shopee',
            shopName || ''
        );
        return NextResponse.json(newReport);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to save report' }, { status: 500 });
    }
}


export async function PUT(request: Request) {
    try {
        await initDatabase();
        const body = await request.json();
        const { id } = body;
        if (id) {
            await toggleReportStatus(id);
            return NextResponse.json({ success: true });
        }
        return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    } catch (error) {
        console.error('API Error in PUT /api/reports:', error);
        return NextResponse.json({ error: 'Failed to update report status' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        await initDatabase();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (id) {
            await deleteReport(id);
            return NextResponse.json({ success: true });
        }
        return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    } catch (error) {
        console.error('API Error in DELETE /api/reports:', error);
        return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
    }
}
