
"use server";

import { google } from "googleapis";
import { recommendVehiclesAssignments, type RecommendVehiclesAssignmentsInput } from "@/ai/flows/recommend-vehicles-assignments";
import type { FleetData, Assignment, Vehicle, SyncStatus, AdminData } from "@/lib/types";
import { promises as fs } from 'fs';
import path from 'path';

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
const DATA_DIR_PATH = path.join(process.cwd(), 'public', 'data');
const FLEET_DATA_PATH = path.join(DATA_DIR_PATH, 'fleetData.json');
const SYNC_STATUS_PATH = path.join(DATA_DIR_PATH, 'syncStatus.json');
const ADMIN_DATA_PATH = path.join(DATA_DIR_PATH, 'admin.json');

async function readJsonFile<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    await fs.mkdir(DATA_DIR_PATH, { recursive: true });
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2));
      return defaultValue;
    }
    console.error(`Error reading or creating ${path.basename(filePath)}:`, error);
    return defaultValue;
  }
}

async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  await fs.mkdir(DATA_DIR_PATH, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// Sync Status Functions
async function readSyncStatus(): Promise<SyncStatus> {
  return readJsonFile(SYNC_STATUS_PATH, { lastSync: null, canSync: true });
}

async function writeSyncStatus(status: SyncStatus): Promise<void> {
  await writeJsonFile(SYNC_STATUS_PATH, status);
}

export async function getSyncStatus(): Promise<SyncStatus> {
    const status = await readSyncStatus();
    if (status.lastSync) {
        const isReady = new Date().getTime() - new Date(status.lastSync).getTime() > ONE_DAY_IN_MS;
        return { ...status, canSync: isReady };
    }
    return { lastSync: null, canSync: true };
}

// Admin Data Functions
export async function getAdminData(): Promise<AdminData> {
    return readJsonFile(ADMIN_DATA_PATH, { publicMessage: '', showPublicMessage: false });
}

export async function updateAdminData(data: AdminData): Promise<void> {
    await writeJsonFile(ADMIN_DATA_PATH, data);
}

export async function syncFleetData({ isAdmin = false } = {}): Promise<FleetData> {
  const syncStatus = await readSyncStatus();

  if (!isAdmin && syncStatus.lastSync && (new Date().getTime() - new Date(syncStatus.lastSync).getTime() < ONE_DAY_IN_MS)) {
    throw new Error("Sync is only allowed once every 24 hours.");
  }

  const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
  const RANGE = process.env.RANGE;
  const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;

  if (!SPREADSHEET_ID || !RANGE || !API_KEY) {
    throw new Error("Missing Google Sheets API configuration in environment variables.");
  }

  const sheets = google.sheets({ version: "v4", auth: API_KEY });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
  });

  const rows = response.data.values;
  if (!rows) {
    throw new Error("No data found in spreadsheet.");
  }
  
  const assignments: Assignment[] = [];
  const vehicles: Vehicle[] = [];
  const assignmentNameRegex = /^(\d{2,}[A-Z]?)\s*—\s*(.+)$/;

  rows.forEach((row: any[]) => {
    if (row.length === 0 || !row[0]) return;

    // Skip rows with em-dash, as they are not valid assignments
    if ((row[0] as string).includes('—')) {
        const assignmentMatch = (row[0] as string).match(assignmentNameRegex);
        if (assignmentMatch) {
            const id = "1" + assignmentMatch[1];
            assignments.push({
                id: id,
                name: `${assignmentMatch[2]} (${assignmentMatch[1]})`,
            });
        }
    } else {
      // It's a vehicle row
      const paddedRow = [...row];
      while (paddedRow.length < 13) {
        paddedRow.push('');
      }
      
      const vehicle: Vehicle = {
        id: paddedRow[0], // Index
        plate: paddedRow[1],
        makeModel: paddedRow[2],
        alpr: paddedRow[4] === '1',
        ol: paddedRow[9],
        authorized: paddedRow[10],
        purpose: paddedRow[11],
        notes: paddedRow[12],
      };
      vehicles.push(vehicle);
    }
  });
  
  assignments.sort((a, b) => a.name.localeCompare(b.name));
  
  const fleetData: FleetData = { assignments, vehicles };
  
  // Store the data in a JSON file
  await fs.writeFile(FLEET_DATA_PATH, JSON.stringify(fleetData, null, 2));

  // Update sync status on successful sync
  await writeSyncStatus({ lastSync: new Date().toISOString(), canSync: false });

  return fleetData;
}

export async function getRecommendations(input: RecommendVehiclesAssignmentsInput) {
    return await recommendVehiclesAssignments(input);
}
