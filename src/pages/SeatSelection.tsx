import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "@/components/Header";
import SeatButton from "@/components/SeatButton";
import CoachSelector from "@/components/CoachSelector";
import SeatLockTimer from "@/components/SeatLockTimer";
import { BookingData, BerthType, BERTH_LABELS, FARES, CoachData, SeatStatus, SeatInventory } from "@/types/booking";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkles, Users, MapPin, Accessibility, Group, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { lockSeats, releaseSeats, subscribeToCoachSeats } from "@/services/bookingService";
import { scoreSeats } from "@/services/recommendationService";

const coachConfigs: Record<string, any> = {
  "1a": { title: "AC 1st Class", totalSeats: 24, pattern: ["lb", "ub"], hasSide: false, sidePattern: [], gridCols: 2, blocks: 12, seatsPerBlock: 2 },
  "2a": { title: "AC 2 Tier", totalSeats: 54, pattern: ["lb", "ub", "lb", "ub"], hasSide: true, sidePattern: ["sl", "su"], gridCols: 2, blocks: 9, seatsPerBlock: 4 },
  "3a": { title: "AC 3 Tier", totalSeats: 72, pattern: ["lb", "mb", "ub", "lb", "mb", "ub"], hasSide: true, sidePattern: ["sl", "su"], gridCols: 3, blocks: 9, seatsPerBlock: 6 },
  sl: { title: "Sleeper Class", totalSeats: 72, pattern: ["lb", "mb", "ub", "lb", "mb", "ub"], hasSide: true, sidePattern: ["sl", "su"], gridCols: 3, blocks: 9, seatsPerBlock: 6 },
  cc: { title: "AC Chair Car", totalSeats: 60, pattern: ["cc", "cc", "cc"], hasSide: false, sidePattern: [], gridCols: 3, blocks: 20, seatsPerBlock: 3 },
};

const SeatSelection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { coachType } = useParams<{ coachType: string }>();
  const coachClass = coachType?.toLowerCase() || "3a";
  const config = coachConfigs[coachClass] || coachConfigs["3a"];

  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [seatTypes, setSeatTypes] = useState<Record<number, BerthType>>({});
  const [currentCoach, setCurrentCoach] = useState<CoachData | null>(null);
  const [coaches, setCoaches] = useState<CoachData[]>([]);
  const [realTimeSeats, setRealTimeSeats] = useState<Record<number, SeatStatus>>({});
  const [recommendation, setRecommendation] = useState<any>(null);

  const anonymousId = useState(() => `anon_${Math.random().toString(36).substr(2, 9)}`)[0];
  const effectiveUserId = user?.uid || anonymousId;

  useEffect(() => {
    const data = sessionStorage.getItem("bookingData");
    if (data) {
      const parsed = JSON.parse(data);
      setBookingData(parsed);
      
      const prefix = coachClass.toUpperCase() === 'SL' ? 'S' : coachClass.toUpperCase() === '3A' ? 'B' : coachClass.toUpperCase() === '2A' ? 'A' : 'H';
      const mockCoaches: CoachData[] = Array.from({ length: 5 }, (_, i) => ({
        id: `${prefix}${i + 1}`,
        type: coachClass.toUpperCase(),
        occupancy: Math.floor(Math.random() * 80) + 10,
        availableSeats: Math.floor(Math.random() * 30) + 5,
        totalSeats: config.totalSeats
      }));
      setCoaches(mockCoaches);
      setCurrentCoach(mockCoaches[0]);
    } else {
      navigate("/");
    }
  }, [navigate, coachClass]);

  useEffect(() => {
    if (currentCoach && bookingData?.train?.number) {
      const unsubscribe = subscribeToCoachSeats(
        bookingData.train.number,
        currentCoach.id,
        (seats) => {
          const seatMap: Record<number, SeatStatus> = {};
          seats.forEach(s => seatMap[s.number] = s);
          setRealTimeSeats(seatMap);
        }
      );
      return () => unsubscribe();
    }
  }, [currentCoach, bookingData?.train?.number]);

  const handleRecommend = () => {
    const availableSeats: SeatInventory[] = [];
    for (let i = 1; i <= config.totalSeats; i++) {
      if (!realTimeSeats[i] || realTimeSeats[i].status === 'AVAILABLE') {
        availableSeats.push({
          id: `${i}`,
          trainNo: bookingData!.train.number,
          date: bookingData!.date,
          coachId: currentCoach!.id,
          seatNo: i,
          berthType: 'lb', // Simplified for scoring
          status: 'AVAILABLE'
        });
      }
    }
    
    const scored = scoreSeats(availableSeats, [], currentCoach!.occupancy);
    setRecommendation(scored[0]);
    toast.success(`AI Recommended: Seat ${scored[0].seatNo} (${scored[0].recommendation})`);
  };

  const toggleSeat = async (num: number, type: BerthType) => {
    if (selectedSeats.includes(num)) {
      setSelectedSeats(prev => prev.filter(n => n !== num));
      await releaseSeats(bookingData!.train.number, currentCoach!.id, [num], effectiveUserId);
    } else {
      if (selectedSeats.length >= 6) return toast.error("Max 6 seats");
      try {
        await lockSeats(bookingData!.train.number, currentCoach!.id, [num], effectiveUserId);
        setSelectedSeats(prev => [...prev, num]);
        setSeatTypes(prev => ({ ...prev, [num]: type }));
      } catch (e) {
        toast.error("Seat already locked");
      }
    }
  };

  const handleProceed = () => {
    const farePerSeat = FARES[coachClass.toUpperCase()] || 460;
    const updatedData = {
      ...bookingData!,
      coach: currentCoach?.id || "",
      seats: selectedSeats.sort((a, b) => a - b),
      seatTypes,
      fare: farePerSeat,
      totalFare: selectedSeats.length * farePerSeat,
    };
    sessionStorage.setItem("bookingData", JSON.stringify(updatedData));
    navigate("/passengers");
  };

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      <div className="max-w-7xl mx-auto px-5 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-80 shrink-0 space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-2xl font-black text-primary mb-2">{config.title}</h2>
              <Button 
                onClick={handleRecommend}
                className="w-full mt-4 bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Recommend Best Seats
              </Button>
            </div>

            {selectedSeats.length > 0 && (
              <div className="glass-card p-6 animate-scale-in">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-black text-lg">Selection</h3>
                  <SeatLockTimer onExpire={() => setSelectedSeats([])} />
                </div>
                <Button onClick={handleProceed} className="w-full py-6 btn-primary-gradient font-black rounded-2xl">
                  Confirm & Continue
                </Button>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-6">
            <div className="glass-card p-6">
              <CoachSelector coaches={coaches} selectedId={currentCoach?.id || ""} onSelect={setCurrentCoach} />
            </div>

            <div className="glass-card p-8 overflow-x-auto">
              <div className="min-w-[600px] flex justify-center gap-12">
                <div className="grid gap-6 p-8 border-x-8 border-primary/20 rounded-3xl" style={{ gridTemplateColumns: `repeat(${config.gridCols}, 1fr)` }}>
                  {Array.from({ length: config.totalSeats }).map((_, i) => {
                    const num = i + 1;
                    const status = realTimeSeats[num]?.status || 'AVAILABLE';
                    return (
                      <SeatButton
                        key={num}
                        number={num}
                        type="lb"
                        isBooked={status === 'BOOKED'}
                        isLocked={status === 'LOCKED' && realTimeSeats[num]?.lockedBy !== effectiveUserId}
                        isSelected={selectedSeats.includes(num)}
                        onClick={() => toggleSeat(num, 'lb')}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatSelection;