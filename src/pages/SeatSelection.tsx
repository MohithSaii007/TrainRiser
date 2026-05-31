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
  const [realTimeSeats, setRealTimeSeats] = useState<Record<number, any>>({});

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
          const seatMap: Record<number, any> = {};
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
      const status = realTimeSeats[i]?.status || 'AVAILABLE';
      if (status === 'AVAILABLE') {
        availableSeats.push({
          id: `${i}`,
          trainNo: bookingData!.train.number,
          date: bookingData!.date,
          coachId: currentCoach!.id,
          seatNo: i,
          berthType: getBerthType(i),
          status: 'AVAILABLE'
        });
      }
    }
    
    const scored = scoreSeats(availableSeats, [], currentCoach!.occupancy);
    if (scored.length > 0) {
      const best = scored[0];
      toast.success(`AI Recommended: Seat ${best.seatNo} (${best.recommendation})`, {
        icon: <Sparkles className="w-4 h-4 text-primary" />
      });
    }
  };

  const getBerthType = (num: number): BerthType => {
    if (coachClass === 'cc') return 'cc';
    const mod = num % 8;
    if (mod === 1 || mod === 4) return 'lb';
    if (mod === 2 || mod === 5) return 'mb';
    if (mod === 3 || mod === 6) return 'ub';
    if (mod === 7) return 'sl';
    return 'su';
  };

  const toggleSeat = async (num: number) => {
    const type = getBerthType(num);
    if (selectedSeats.includes(num)) {
      setSelectedSeats(prev => prev.filter(n => n !== num));
      try {
        await releaseSeats(bookingData!.train.number, currentCoach!.id, [num], effectiveUserId);
      } catch (e) {
        // Silent fail for release, local state is updated
      }
    } else {
      if (selectedSeats.length >= 6) return toast.error("Maximum 6 seats allowed per booking");
      
      // Optimistic local selection
      setSelectedSeats(prev => [...prev, num]);
      setSeatTypes(prev => ({ ...prev, [num]: type }));

      try {
        await lockSeats(bookingData!.train.number, currentCoach!.id, [num], effectiveUserId);
      } catch (e: any) {
        // If database lock fails, we still allow local selection for demo purposes
        // but we notify the user if it's a real conflict
        if (e.message.includes("already locked") || e.message.includes("already booked")) {
          setSelectedSeats(prev => prev.filter(n => n !== num));
          toast.error(e.message);
        } else {
          console.warn("Database lock failed, continuing in local mode:", e.message);
        }
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
              <p className="text-sm text-muted-foreground mb-4">Select up to 6 seats for your journey.</p>
              <Button 
                onClick={handleRecommend}
                className="w-full bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 font-bold"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Recommendation
              </Button>
            </div>

            {selectedSeats.length > 0 && (
              <div className="glass-card p-6 animate-scale-in border-primary/30">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-black text-lg">Selected ({selectedSeats.length})</h3>
                  <SeatLockTimer onExpire={() => setSelectedSeats([])} />
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedSeats.map(s => (
                    <Badge key={s} className="bg-primary text-primary-foreground font-bold px-3 py-1">
                      Seat {s}
                    </Badge>
                  ))}
                </div>
                <Button onClick={handleProceed} className="w-full py-6 btn-primary-gradient font-black text-lg rounded-2xl shadow-lg shadow-primary/20">
                  Continue to Passengers
                </Button>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-6">
            <div className="glass-card p-6">
              <CoachSelector coaches={coaches} selectedId={currentCoach?.id || ""} onSelect={setCurrentCoach} />
            </div>

            <div className="glass-card p-8 overflow-x-auto">
              <div className="min-w-[600px] flex flex-col items-center">
                <div className="mb-8 flex gap-8 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-muted border border-black" /> Available</div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-primary border border-black" /> Selected</div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-destructive border border-black" /> Booked</div>
                </div>

                <div className="grid gap-6 p-10 border-x-[12px] border-primary/10 rounded-[40px] bg-background/20" style={{ gridTemplateColumns: `repeat(${config.gridCols}, 1fr)` }}>
                  {Array.from({ length: config.totalSeats }).map((_, i) => {
                    const num = i + 1;
                    const seatData = realTimeSeats[num];
                    const status = seatData?.status || 'AVAILABLE';
                    const isLockedByOthers = status === 'LOCKED' && seatData?.lockedBy !== effectiveUserId;
                    
                    return (
                      <SeatButton
                        key={num}
                        number={num}
                        type={getBerthType(num)}
                        isBooked={status === 'BOOKED'}
                        isLocked={isLockedByOthers}
                        isSelected={selectedSeats.includes(num)}
                        onClick={() => toggleSeat(num)}
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