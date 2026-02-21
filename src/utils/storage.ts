import fs from 'fs';
import path from 'path';
import { Database, ReportFile, ShopeeOrder } from './types';

const DB_PATH = path.join(process.cwd(), 'src', 'data', 'db.json');
const DATA_DIR = path.join(process.cwd(), 'src', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize DB if not exists
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ reports: [] }, null, 2));
}

export const getDatabase = (): Database => {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return { reports: [] };
    }
};

export const saveDatabase = (db: Database) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
};

export const addReport = (name: string, orders: ShopeeOrder[]): ReportFile => {
    const db = getDatabase();
    const newReport: ReportFile = {
        id: Date.now().toString(),
        name,
        uploadDate: new Date().toISOString(),
        isActive: true,
        orders,
        orderCount: orders.length
    };
    db.reports.push(newReport);
    saveDatabase(db);
    return newReport;
};

export const getReports = (): ReportFile[] => {
    const db = getDatabase();
    return db.reports.map(r => {
        const { orders, ...metadata } = r;
        return {
            ...metadata,
            orders: [],
            orderCount: metadata.orderCount || (orders ? orders.length : 0)
        } as ReportFile;
    });
};

export const getReportById = (id: string): ReportFile | undefined => {
    const db = getDatabase();
    return db.reports.find(r => r.id === id);
}

export const getAllOrders = (): ShopeeOrder[] => {
    const db = getDatabase();
    // Aggregate orders from all ACTIVE reports
    return db.reports
        .filter(r => r.isActive)
        .flatMap(r => r.orders);
}

export const toggleReportStatus = (id: string) => {
    const db = getDatabase();
    const report = db.reports.find(r => r.id === id);
    if (report) {
        report.isActive = !report.isActive;
        saveDatabase(db);
    }
};

export const deleteReport = (id: string) => {
    const db = getDatabase();
    db.reports = db.reports.filter(r => r.id !== id);
    saveDatabase(db);
};
