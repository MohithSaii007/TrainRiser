import { SeatInventory, BerthType, Passenger } from "@/types/booking";

export const scoreSeats = (
  seats: SeatInventory[], 
  passengers: Passenger[], 
  coachOccupancy: number
) => {
  return seats.map(seat => {
    let score = 100;
    const reasons: string[] = [];

    // 1. Senior Citizen Logic
    const hasSenior = passengers.some(p => parseInt(p.age) >= 60);
    if (hasSenior) {
      if (seat.berthType === 'lb' || seat.berthType === 'sl') {
        score += 50;
        reasons.push("Lower berth priority for senior citizens");
      } else {
        score -= 30;
      }
    }

    // 2. Crowd Logic
    if (coachOccupancy < 30) {
      score += 20;
      reasons.push("Low crowd coach");
    } else if (coachOccupancy > 80) {
      score -= 20;
    }

    // 3. Position Logic
    const isNearDoor = seat.seatNo <= 8 || seat.seatNo >= 64;
    if (isNearDoor) {
      score -= 10;
      reasons.push("Near exit/toilets");
    } else {
      score += 15;
      reasons.push("Quiet middle-bay seat");
    }

    // 4. Berth Preference
    const preferredBerth = passengers[0]?.preference;
    if (preferredBerth === seat.berthType) {
      score += 40;
      reasons.push("Matches your berth preference");
    }

    return {
      ...seat,
      score,
      recommendation: reasons[0] || "Standard seat"
    };
  }).sort((a, b) => b.score - a.score);
};