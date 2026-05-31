import { db } from "@/lib/firebase";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  runTransaction,
  writeBatch,
  orderBy,
  limit
} from "firebase/firestore";
import { SeatInventory, COACH_COMPOSITION, BerthType, SeatStatus, BookingData } from "@/types/booking";

export const initializeInventory = async (trainNo: string, date: string) => {
  const batch = writeBatch(db);
  const inventoryRef = collection(db, "seat_inventory");
  
  for (const [type, config] of Object.entries(COACH_COMPOSITION)) {
    for (let i = 1; i <= config.count; i++) {
      const coachId = `${config.prefix}${i}`;
      const coachRef = doc(db, "coach_inventory", `${trainNo}_${date}_${coachId}`);
      
      batch.set(coachRef, {
        trainNo,
        date,
        coachId,
        type,
        availableCount: config.seats,
        racCount: 0,
        wlCount: 0,
        occupancy: 0
      });

      for (let s = 1; s <= config.seats; s++) {
        const seatId = `${trainNo}_${date}_${coachId}_${s}`;
        const berthType = getBerthType(s, type);
        batch.set(doc(inventoryRef, seatId), {
          trainNo,
          date,
          coachId,
          seatNo: s,
          berthType,
          status: 'AVAILABLE'
        });
      }
    }
  }
  await batch.commit();
};

const getBerthType = (seatNo: number, coachType: string): BerthType => {
  if (coachType === 'CC') return 'cc';
  const mod = seatNo % 8;
  if (mod === 1 || mod === 4) return 'lb';
  if (mod === 2 || mod === 5) return 'mb';
  if (mod === 3 || mod === 6) return 'ub';
  if (mod === 7) return 'sl';
  return 'su';
};

export const getAvailability = async (trainNo: string, date: string, coachType: string) => {
  const q = query(
    collection(db, "coach_inventory"),
    where("trainNo", "==", trainNo),
    where("date", "==", date),
    where("type", "==", coachType)
  );
  
  const snap = await getDocs(q);
  if (snap.empty) {
    await initializeInventory(trainNo, date);
    return getAvailability(trainNo, date, coachType);
  }

  let totalAvailable = 0;
  let totalRAC = 0;
  let totalWL = 0;
  let totalOccupancy = 0;
  let coachCount = 0;

  snap.forEach(doc => {
    const data = doc.data();
    totalAvailable += data.availableCount;
    totalRAC += data.racCount;
    totalWL += data.wlCount;
    totalOccupancy += data.occupancy;
    coachCount++;
  });

  return {
    available: totalAvailable,
    rac: totalRAC,
    wl: totalWL,
    avgOccupancy: totalOccupancy / coachCount
  };
};

export const processCancellation = async (pnr: string) => {
  await runTransaction(db, async (transaction) => {
    const bookingRef = doc(db, "bookings", pnr);
    const bookingSnap = await transaction.get(bookingRef);
    if (!bookingSnap.exists()) return;

    const booking = bookingSnap.data() as BookingData;
    const { train, date, coach, seats } = booking;

    // 1. Release seats
    for (const seatNo of seats) {
      const seatId = `${train.number}_${date}_${coach}_${seatNo}`;
      const seatRef = doc(db, "seat_inventory", seatId);
      transaction.update(seatRef, { status: 'AVAILABLE', pnr: null });
    }

    // 2. Update coach inventory
    const coachRef = doc(db, "coach_inventory", `${train.number}_${date}_${coach}`);
    const coachSnap = await transaction.get(coachRef);
    const coachData = coachSnap.data();
    transaction.update(coachRef, {
      availableCount: coachData.availableCount + seats.length,
      occupancy: ((coachData.totalSeats - (coachData.availableCount + seats.length)) / coachData.totalSeats) * 100
    });

    // 3. Promote RAC to Confirmed
    const racQuery = query(
      collection(db, "bookings"),
      where("train.number", "==", train.number),
      where("date", "==", date),
      where("status", "==", "CONFIRMED"),
      where("passengers", "array-contains", { status: "RAC" }),
      orderBy("createdAt", "asc"),
      limit(seats.length)
    );
    
    // Note: Complex promotion logic would continue here, 
    // updating passenger statuses and seat assignments.
    
    transaction.update(bookingRef, { status: 'CANCELLED' });
  });
};