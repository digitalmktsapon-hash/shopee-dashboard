import { NextResponse } from 'next/server';
import { getAllOrders } from '@/utils/storage';

export async function GET() {
    const orders = getAllOrders();
    return NextResponse.json(orders);
}
