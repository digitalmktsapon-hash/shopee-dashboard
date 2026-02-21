import { NextResponse } from 'next/server';
import { getReports, addReport, deleteReport, toggleReportStatus, getAllOrders } from '@/utils/storage';
import { ShopeeOrder } from '@/utils/types';

export async function GET() {
    const reports = getReports();
    return NextResponse.json(reports);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, orders } = body;

        if (!name || !orders) {
            return NextResponse.json({ error: 'Missing name or orders' }, { status: 400 });
        }

        const newReport = addReport(name, orders as ShopeeOrder[]);
        return NextResponse.json(newReport);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save report' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    // Toggle status
    const body = await request.json();
    const { id } = body;
    if (id) {
        toggleReportStatus(id);
        return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (id) {
        deleteReport(id);
        return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
}
