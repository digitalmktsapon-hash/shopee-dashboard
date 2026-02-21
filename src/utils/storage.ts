import fs from 'fs/promises';
import path from 'path';
import { ReportFile, ShopeeOrder, Platform } from './types';

// Path to the local JSON database
const DB_PATH = path.join(process.cwd(), 'src', 'data', 'db.json');

// Interface for our local JSON database structure
interface LocalDatabase {
  reports: ReportFile[];
  orders: Record<string, ShopeeOrder[]>; // map of report_id -> orders array
}

// Helper to read the DB
async function readDB(): Promise<LocalDatabase> {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // Document doesn't exist, create default
      const defaultDB: LocalDatabase = { reports: [], orders: {} };
      await writeDB(defaultDB);
      return defaultDB;
    }
    throw error;
  }
}

// Helper to write the DB
async function writeDB(db: LocalDatabase): Promise<void> {
  // Ensure directory exists
  const dir = path.dirname(DB_PATH);
  await fs.mkdir(dir, { recursive: true });

  // Write atomically
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

export async function initDatabase() {
  // Just ensures the file exists
  await readDB();
}

export const addReport = async (
  name: string,
  orders: ShopeeOrder[],
  platform: Platform = 'shopee',
  shopName: string = ''
): Promise<ReportFile> => {
  const id = Date.now().toString();
  const uploadDate = new Date().toISOString();

  const db = await readDB();
  if (!db.reports) db.reports = [];
  if (!db.orders) db.orders = {};

  const newReport: ReportFile = {
    id,
    name,
    uploadDate,
    isActive: true,
    orders: [], // We don't store full orders in the report metadata object
    orderCount: orders.length,
    platform,
    shopName,
  };

  // Save report metadata
  db.reports.push(newReport);

  // Save orders list mapping to this report id
  db.orders[id] = orders;

  // Persist to file
  await writeDB(db);

  return newReport;
};

export const getReports = async (): Promise<ReportFile[]> => {
  const db = await readDB();
  // Sort descending by uploadDate
  return db.reports.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
};

export const getReportById = async (id: string): Promise<ReportFile | undefined> => {
  const db = await readDB();
  const report = db.reports.find(r => r.id === id);
  if (!report) return undefined;

  // Attach orders
  return {
    ...report,
    orders: db.orders[id] || []
  };
};

export const getAllOrders = async (platform?: string, shopName?: string): Promise<ShopeeOrder[]> => {
  const db = await readDB();

  // Filter active reports
  let activeReports = db.reports.filter(r => r.isActive);

  // Filter by platform & shopName if provided
  if (platform && platform !== 'all') {
    activeReports = activeReports.filter(r => r.platform === platform && r.shopName === (shopName || ''));
  }

  let allOrders: ShopeeOrder[] = [];
  for (const report of activeReports) {
    if (db.orders[report.id]) {
      allOrders = allOrders.concat(db.orders[report.id]);
    }
  }

  return allOrders;
};

export const toggleReportStatus = async (id: string) => {
  const db = await readDB();
  const report = db.reports.find(r => r.id === id);
  if (report) {
    report.isActive = !report.isActive;
    await writeDB(db);
  }
};

export const deleteReport = async (id: string) => {
  const db = await readDB();

  // Remove report
  if (db.reports) {
    db.reports = db.reports.filter(r => r.id !== id);
  }

  // Remove associated orders
  if (db.orders && db.orders[id]) {
    delete db.orders[id];
  }

  await writeDB(db);
};
