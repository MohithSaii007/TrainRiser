import { db } from "@/lib/firebase";
import { 
  doc, 
  getDoc, 
  onSnapshot, 
  updateDoc, 
  collection, 
  runTransaction
} from "firebase/firestore";
import { SeatStatus } from "@/types/booking";

export const lockSeats = async (
  trainId: string, 
  coachId: string, 
  seatNumbers: number[], 
  userId: string
) => {
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  try {
    return await runTransaction(db, async (transaction) => {
      const results = [];
      
      for (const seatNum of seatNumbers) {
        const seatRef = doc(db, "trains", trainId, "coaches", coachId, "seats", seatNum.toString());
        const seatSnap = await transaction.get(seatRef);

        if (seatSnap.exists()) {
          const data = seatSnap.data();
          // If seat is locked by someone else and not expired
          if (data.status === 'locked' && data.lockedBy !== userId && data.expiresAt > Date.now()) {
            throw new Error(`Seat ${seatNum} is already locked by another user`);
          }
          // If seat is already booked
          if (data.status === 'booked') {
            throw new Error(`Seat ${seatNum} is already booked`);
          }
        }

        transaction.set(seatRef, {
          number: seatNum,
          status: 'locked',
          lockedBy: userId,
          expiresAt: expiresAt
        }, { merge: true });
        
        results.push({ number: seatNum, expiresAt });
      }
      return results;
    });
  } catch (error) {
    console.error("Error in lockSeats transaction:", error);
    throw error;
  }
};

export const releaseSeats = async (trainId: string, coachId: string, seatNumbers: number[], userId: string) => {
  try {
    for (const seatNum of seatNumbers) {
      const seatRef = doc(db, "trains", trainId, "coaches", coachId, "seats", seatNum.toString());
      const seatSnap = await getDoc(seatRef);
      if (seatSnap.exists() && seatSnap.data().lockedBy === userId) {
        await updateDoc(seatRef, {
          status: 'available',
          lockedBy: null,
          expiresAt: null
        });
      }
    }
  } catch (error) {
    console.error("Error in releaseSeats:", error);
    throw error;
  }
};

export const subscribeToCoachSeats = (
  trainId: string, 
  coachId: string, 
  callback: (seats: SeatStatus[]) => void
) => {
  const seatsRef = collection(db, "trains", trainId, "coaches", coachId, "seats");
  return onSnapshot(seatsRef, (snapshot) => {
    const seats = snapshot.docs.map(doc => doc.data() as SeatStatus);
    callback(seats);
  }, (error) => {
    console.error("Firestore subscription error:", error);
  });
};