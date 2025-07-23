"use server";

import { google } from "googleapis";
import { recommendVehiclesAssignments, type RecommendVehiclesAssignmentsInput } from "@/ai/flows/recommend-vehicles-assignments";
import type { FleetData, Assignment, Vehicle } from "@/lib/types";
import { promises as fs } from 'fs';
import path from 'path';

export async function syncFleetData(): Promise<FleetData> {
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

    const assignmentMatch = (row[0] as string).match(assignmentNameRegex);
    
    if (assignmentMatch) {
      const id = "1" + assignmentMatch[1];
      assignments.push({
        id: id,
        name: `${assignmentMatch[2]} (${assignmentMatch[1]})`,
      });
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
  const dataDirPath = path.join(process.cwd(), 'public', 'data');
  await fs.mkdir(dataDirPath, { recursive: true });
  await fs.writeFile(path.join(dataDirPath, 'fleetData.json'), JSON.stringify(fleetData, null, 2));

  return fleetData;
}

export async function getRecommendations(input: RecommendVehiclesAssignmentsInput) {
    return await recommendVehiclesAssignments(input);
}
