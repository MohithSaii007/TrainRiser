export type BerthType = 'lb' | 'mb' | 'ub' | 'sl' | 'su' | 'cc';

export interface Station {
  code: string;
  name: string;
}

export interface CoachData {
  id: string;
  type: string;
  classType: string; // SL, 3A, 2A, 1A
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
  duration: string;
  fromStation: string;
  toStation: string;
  coaches: string[];
  crowdLevel: 'low' | 'medium' | 'high';
  confirmationProb?: number;
  rating: number;
  onTime: string; // e.g. "95%"
  meals: boolean;
  platform?: string;
  availability: Record<string, { status: string; count: number; color: 'green' | 'orange' | 'red' }>;
}

export interface Passenger {
  name: string;
  age: string;
  gender: 'male' | 'female' | 'other';
  mobile: string;
  email: string;
  seatNumber: number;
  berthType: string;
  preference?: BerthType;
}

export interface BookingData {
  train: Train;
  from: string;
  to: string;
  date: string;
  coachId: string; // e.g. S1
  coachType: string; // e.g. SL
  fare: number;
  gst: number;
  seats: number[];
  seatTypes: Record<number, string>;
  totalFare: number;
  passengers?: Passenger[];
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