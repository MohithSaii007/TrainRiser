import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "@/components/Header";
import SeatButton from "@/components/SeatButton";
import SeatLockTimer from "@/components/SeatLockTimer";
import { BookingData, BerthType, BERTH_LABELS, FARES, SeatStatus } from "@/types/booking";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Users, Info, ShieldCheck, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { lockSeats, releaseSeats, subscribeToCoachSeats } from "@/services/bookingService";

interface CoachConfig {
  title: string;
  totalSeats: number;
  pattern: BerthType[];
  hasSide: boolean;
  sidePattern: BerthType[];
  gridCols: number;
  blocks: number;
  seatsPerBlock: number;
}

const coachConfigs: Record<string, CoachConfig> = {
  sl: { title: "Sleeper Class", totalSeats: 72, pattern: ["lb", "mb", "ub", "lb", "mb", "ub"], hasSide: true, sidePattern: ["sl", "su"], gridCols: 3, blocks: 9, seatsPerBlock: 6 },
  "3a": { title: "AC 3 Tier", totalSeats: 64, pattern: ["lb", "mb", "ub", "lb", "mb", "ub"], hasSide: true, sidePattern: ["sl", "su"], gridCols: 3, blocks: 8, seatsPerBlock: 6 },
  "2a": { title: "AC 2 Tier", totalSeats: 48, pattern: ["lb", "ub", "lb", "ub"], hasSide: true, sidePattern: ["sl", "su"], gridCols: 2, blocks: 8, seatsPerBlock: 4 },
  "1a": { title: "AC 1st Class", totalSeats: 24, pattern: ["lb", "ub"], hasSide: false, sidePattern: [], gridCols: 2, blocks: 12, seatsPerBlock: 2 },
};

const SeatSelection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { coachType } = useParams<{ coachType: string }>();
  const coachClass = coachType?.toLowerCase() || "sl";
  const config = coachConfigs[coachClass] || coachConfigs["sl"];

  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [seatTypes, setSeatTypes] = useState<Record<number, BerthType>>({});
  const [realTimeSeats, setRealTimeSeats] = useState<Record<number, SeatStatus>>({});
  const [isLocking, setIsLocking] = useState(false);

  const effectiveUserId = user?.uid || "anonymous";

  useEffect(() => {
    const data = sessionStorage.getItem("bookingData");
    if (data) {
      setBookingData(JSON.parse(data));
    } else {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    if (bookingData?.train?.number && bookingData?.coachId) {
      const unsubscribe = subscribeToCoachSeats(
        bookingData.train.number,
        bookingData.coachId,
        (seats) => {
          const seatMap: Record<number, SeatStatus> = {};
          seats.forEach(s => seatMap[s.number] = s);
          setRealTimeSeats(seatMap);
        }
      );
      return () => unsubscribe();
    }
  }, [bookingData]);

  const toggleSeat = async (num: number, type: BerthType) => {
    const seatStatus = realTimeSeats[num];
    if (seatStatus?.status === 'booked') {
      toast.error("Seat is already booked");
      return;
    }

    if (selectedSeats.includes(num)) {
      setSelectedSeats(prev => prev.filter(n => n !== num));
      setSeatTypes(prev => {
        const next = { ...prev };
        delete next[num];
        return next;
      });
    } else {
      if (selectedSeats.length >= 6) {
        toast.error("Maximum 6 seats allowed per booking");
        return;
      }
      setSelectedSeats(prev => [...prev, num]);
      setSeatTypes(prev => ({ ...prev, [num]: type }));
    }
  };

  const handleProceed = () => {
    if (selectedSeats.length === 0) {
      toast.error("Please select at least one seat");
      return;
    }

    const fare = bookingData!.fare;
    const gst = Math.round(fare * 0.05 * selectedSeats.length);
    const totalFare = (fare * selectedSeats.length) + gst;

    const updatedData = {
      ...bookingData!,
      seats: selectedSeats.sort((a, b) => a - b),
      seatTypes,
      gst,
      totalFare,
    };
    sessionStorage.setItem("bookingData", JSON.stringify(updatedData));
    navigate("/passengers");
  };

  const generateSeats = () => {
    const blocks = [];
    let seatNo = 1;

    for (let b = 0; b < config.blocks; b++) {
      const main = [];
      for (let i = 0; i < config.seatsPerBlock; i++) {
        main.push({ num: seatNo, type: config.pattern[i % config.pattern.length] });
        seatNo++;
      }
      const side = [];
      if (config.hasSide) {
        for (const type of config.sidePattern) {
          side.push({ num: seatNo, type });
          seatNo++;
        }
      }
      blocks.push({ main, side });
    }
    return blocks;
  };

  const blocks = generateSeats();

  if (!bookingData) return null;

  return (
    <div className="min-h-screen bg-[#f4f7f4]">
      <div className="bg-[#006633] text-white sticky top-0 z-50">
        <Header />
        <div className="max-w-5xl mx-auto px-5 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold">Select Seats - {bookingData.coachId}</h1>
            <p className="text-xs opacity-80">{bookingData.train.name} | {COACH_NAMES[bookingData.coachType]}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs opacity-70 uppercase font-bold">Selected</div>
              <div className="text-lg font-black">{selectedSeats.length} / 6</div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-5 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
              <div className="min-w-[800px] flex flex-col gap-12">
                {blocks.map((block, bIdx) => (
                  <div key={bIdx} className="flex items-center gap-16 pb-12 border-b border-gray-50 last:border-0">
                    <div className="grid grid-cols-3 gap-4 flex-1">
                      {block.main.map((seat) => {
                        const status = realTimeSeats[seat.num]?.status || 'available';
                        return (
                          <div key={seat.num} className="flex flex-col items-center gap-1">
                            <SeatButton
                              number={seat.num}
                              type={seat.type}
                              isBooked={status === 'booked'}
                              isSelected={selectedSeats.includes(seat.num)}
                              isRAC={status === 'rac'}
                              onClick={() => toggleSeat(seat.num, seat.type)}
                            />
                            <span className="text-[10px] font-bold text-gray-400 uppercase">{seat.type}</span>
                          </div>
                        );
                      })}
                    </div>
                    {block.side.length > 0 && (
                      <div className="flex flex-col gap-4 border-l-2 border-dashed border-gray-100 pl-12">
                        {block.side.map((seat) => {
                          const status = realTimeSeats[seat.num]?.status || 'available';
                          return (
                            <div key={seat.num} className="flex flex-col items-center gap-1">
                              <SeatButton
                                number={seat.num}
                                type={seat.type}
                                isBooked={status === 'booked'}
                                isSelected={selectedSeats.includes(seat.num)}
                                isRAC={status === 'rac'}
                                onClick={() => toggleSeat(seat.num, seat.type)}
                              />
                              <span className="text-[10px] font-bold text-gray-400 uppercase">{seat.type}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-32">
              <h3 className="font-bold text-gray-800 mb-6">Fare Details</h3>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Coach</span>
                  <span className="font-bold">{bookingData.coachId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Seats</span>
                  <span className="font-bold">{selectedSeats.length > 0 ? selectedSeats.join(", ") : "None"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Base Fare ({selectedSeats.length} × ₹{bookingData.fare})</span>
                  <span className="font-bold">₹{selectedSeats.length * bookingData.fare}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">GST (5%)</span>
                  <span className="font-bold">₹{Math.round(selectedSeats.length * bookingData.fare * 0.05)}</span>
                </div>
                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="font-bold text-gray-800">Total Payable</span>
                  <span className="text-2xl font-black text-[#006633]">
                    ₹{Math.round(selectedSeats.length * bookingData.fare * 1.05)}
                  </span>
                </div>
              </div>

              <Button 
                onClick={handleProceed}
                disabled={selectedSeats.length === 0}
                className="w-full py-7 bg-[#006633] hover:bg-[#004d26] text-white font-black text-lg rounded-xl shadow-lg shadow-green-900/20"
              >
                CONTINUE
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>

              <div className="mt-6 grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                  <div className="w-3 h-3 rounded-sm bg-green-500" /> AVAILABLE
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                  <div className="w-3 h-3 rounded-sm bg-red-500" /> BOOKED
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                  <div className="w-3 h-3 rounded-sm bg-yellow-500" /> RAC
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                  <div className="w-3 h-3 rounded-sm bg-blue-500" /> SELECTED
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SeatSelection;