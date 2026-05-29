export interface Train {
  number: string;
  name: string;
  dep: string;
  arr: string;
  coaches: string[];
  crowdLevel: 'low' | 'medium' | 'high';
  confirmationProb?: number; // 0-100 for WL
}

export interface Station {
  code: string;
  name: string;
}

export interface ScheduleEntry {
  train_number: string;
  train_name: string;
  station_code: string;
  arrival: string | null;
  departure: string | null;
  day: number;
}

export interface Passenger {
  name: string;
  age: string;
  seatNumber: number;
  berthType: string;
  preference?: BerthType;
}

export interface CoachData {
  id: string;
  type: string;
  occupancy: number; // 0-100
  availableSeats: number;
}

export interface BookingData {
  train: Train;
  from: string;
  to: string;
  date: string;
  coach: string; // e.g., "S1", "B1"
  coachType: string; // e.g., "SL", "3A"
  fare: number;
  seats: number[];
  seatTypes: Record<number, string>;
  totalFare: number;
  passengers?: Passenger[];
  lockExpiresAt?: number;
}

export const FARES: Record<string, number> = {
  SL: 150,
  "3A": 460,
  "2A": 700,
  "1A": 1050,
};

export const COACH_NAMES: Record<string, string> = {
  SL: "Sleeper Class",
  "3A": "AC 3 Tier",
  "2A": "AC 2 Tier",
  "1A": "AC 1st Class",
};

export type BerthType = 'lb' | 'mb' | 'ub' | 'sl' | 'su';

export const BERTH_LABELS: Record<BerthType, string> = {
  lb: "Lower Berth",
  mb: "Middle Berth",
  ub: "Upper Berth",
  sl: "Side Lower",
  su: "Side Upper",
};