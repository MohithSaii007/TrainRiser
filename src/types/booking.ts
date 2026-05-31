export type BerthType = 'lb' | 'mb' | 'ub' | 'sl' | 'su' | 'cc';

export interface Station {
  code: string;
  name: string;
}

export interface ScheduleEntry {
  station_code: string;
  train_number: string;
  train_name: string;
  day: number;
  departure?: string;
  arrival?: string;
}

export interface CoachData {
  id: string;
  type: string;
  occupancy: number;
  availableSeats: number;
  totalSeats: number;
}

export interface SeatStatus {
  number: number;
  type: BerthType;
  status: 'available' | 'booked' | 'locked' | 'rac' | 'wl';
  lockedBy?: string;
  expiresAt?: number;
}

export interface Train {
  number: string;
  name: string;
  dep: string;
  arr: string;
  coaches: string[];
  crowdLevel: 'low' | 'medium' | 'high';
  confirmationProb?: number;
  route: string[]; // Array of station codes
}

export interface Passenger {
  name: string;
  age: string;
  seatNumber: number;
  berthType: string;
  preference?: BerthType;
}

export interface BookingData {
  train: Train;
  from: string;
  to: string;
  date: string;
  coach: string;
  coachType: string;
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
  "CC": 350,
};

export const COACH_NAMES: Record<string, string> = {
  SL: "Sleeper Class",
  "3A": "AC 3 Tier",
  "2A": "AC 2 Tier",
  "1A": "AC 1st Class",
  "CC": "AC Chair Car",
};

export const BERTH_LABELS: Record<BerthType, string> = {
  lb: "Lower Berth",
  mb: "Middle Berth",
  ub: "Upper Berth",
  sl: "Side Lower",
  su: "Side Upper",
  cc: "Chair Car Seat",
};