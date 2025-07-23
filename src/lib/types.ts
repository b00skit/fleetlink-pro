export interface Assignment {
  id: string;
  name: string;
}

export interface Vehicle {
  id: string; // Corresponds to Index (row[0])
  plate: string;
  makeModel: string;
  alpr: boolean;
  ol: string;
  authorized: string;
  purpose: string;
  notes: string;
}

export interface FleetData {
  assignments: Assignment[];
  vehicles: Vehicle[];
}
