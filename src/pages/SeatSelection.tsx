import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "@/components/Header";
import SeatButton from "@/components/SeatButton";
import CoachSelector from "@/components/CoachSelector";
import SeatLockTimer from "@/components/SeatLockTimer";
import { BookingData, BerthType, BERTH_LABELS, COACH_NAMES, FARES, CoachData } from "@/types/booking";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Info, Sparkles, Users } from "lucide-react";

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
  "1a": { title: "AC 1st Class", totalSeats: 24, pattern: ["lb", "ub"], hasSide: false, sidePattern: [], gridCols: 2, blocks: 12, seatsPerBlock: 2 },
  "2a": { title: "AC 2 Tier", totalSeats: 54, pattern: ["lb", "ub", "lb", "ub"], hasSide: true, sidePattern: ["sl", "su"], gridCols: 2, blocks: 9, seatsPerBlock: 4 },
  "3a": { title: "AC 3 Tier", totalSeats: 72, pattern: ["lb", "mb", "ub", "lb", "mb", "ub"], hasSide: true, sidePattern: ["sl", "su"], gridCols: 3, blocks: 9, seatsPerBlock: 6 },
  sl: { title: "Sleeper Class", totalSeats: 72, pattern: ["lb", "mb", "ub", "lb", "mb", "ub"], hasSide: true, sidePattern: ["sl", "su"], gridCols: 3, blocks: 9, seatsPerBlock: 6 },
};

const SeatSelection = () => {
  const navigate = useNavigate();
  const { coachType } = useParams<{ coachType: string }>();
  const coachClass = coachType?.toLowerCase() || "3a";
  const config = coachConfigs[coachClass] || coachConfigs["3a"];

  const [bookingData, setBookingData] = useState<Partial<BookingData> | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [seatTypes, setSeatTypes] = useState<Record<number, BerthType>>({});
  const [currentCoach, setCurrentCoach] = useState<CoachData | null>(null);
  const [coaches, setCoaches] = useState<CoachData[]>([]);
  const [bookedSeats, setBookedSeats] = useState<number[]>([]);

  useEffect(() => {
    const data = sessionStorage.getItem("bookingData");
    if (data) {
      const parsed = JSON.parse(data);
      setBookingData(parsed);
      
      // Generate mock coaches for this class
      const prefix = coachClass.toUpperCase() === 'SL' ? 'S' : coachClass.toUpperCase() === '3A' ? 'B' : coachClass.toUpperCase() === '2A' ? 'A' : 'H';
      const mockCoaches: CoachData[] = Array.from({ length: 5 }, (_, i) => ({
        id: `${prefix}${i + 1}`,
        type: coachClass.toUpperCase(),
        occupancy: Math.floor(Math.random() * 80) + 10,
        availableSeats: Math.floor(Math.random() * 30) + 5,
      }));
      setCoaches(mockCoaches);
      setCurrentCoach(mockCoaches[0]);
    } else {
      navigate("/");
    }
  }, [navigate, coachClass]);

  useEffect(() => {
    if (currentCoach) {
      // Generate random booked seats for the selected coach
      const count = Math.floor(config.totalSeats * (currentCoach.occupancy / 100));
      const booked: Set<number> = new Set();
      while (booked.size < count) {
        booked.add(Math.floor(Math.random() * config.totalSeats) + 1);
      }
      setBookedSeats(Array.from(booked));
      setSelectedSeats([]); // Reset selection when changing coach
    }
  }, [currentCoach, config.totalSeats]);

  const toggleSeat = (num: number, type: BerthType) => {
    if (bookedSeats.includes(num)) return;

    if (selectedSeats.includes(num)) {
      setSelectedSeats((prev) => prev.filter((n) => n !== num));
      setSeatTypes((prev) => {
        const newTypes = { ...prev };
        delete newTypes[num];
        return newTypes;
      });
    } else {
      if (selectedSeats.length >= 6) {
        toast.error("Maximum 6 seats per booking");
        return;
      }
      setSelectedSeats((prev) => [...prev, num]);
      setSeatTypes((prev) => ({ ...prev, [num]: type }));
      
      // Smart Suggestion: If selecting multiple, suggest nearby seats
      if (selectedSeats.length === 1) {
        toast.info("Smart Tip: Selecting seats in the same compartment keeps families together!");
      }
    }
  };

  const handleProceed = () => {
    if (selectedSeats.length === 0) {
      toast.error("Please select at least one seat");
      return;
    }

    const farePerSeat = FARES[coachClass.toUpperCase()] || 460;
    const updatedData = {
      ...bookingData,
      coach: currentCoach?.id,
      seats: selectedSeats.sort((a, b) => a - b),
      seatTypes,
      farePerSeat,
      totalFare: selectedSeats.length * farePerSeat,
      lockExpiresAt: Date.now() + 300000, // 5 mins lock
    };
    sessionStorage.setItem("bookingData", JSON.stringify(updatedData));
    navigate("/passengers");
  };

  const generateSeats = () => {
    const mainSeats: { num: number; type: BerthType }[] = [];
    const sideSeats: { num: number; type: BerthType }[] = [];
    let seatNo = 1;

    for (let block = 0; block < config.blocks; block++) {
      for (let i = 0; i < config.seatsPerBlock; i++) {
        const typeIndex = i % config.pattern.length;
        mainSeats.push({ num: seatNo, type: config.pattern[typeIndex] });
        seatNo++;
      }
      if (config.hasSide) {
        for (const type of config.sidePattern) {
          sideSeats.push({ num: seatNo, type });
          seatNo++;
        }
      }
    }
    return { mainSeats, sideSeats };
  };

  const { mainSeats, sideSeats } = generateSeats();
  const farePerSeat = FARES[coachClass.toUpperCase()] || 460;
  const legendTypes = [...new Set([...config.pattern, ...config.sidePattern])] as BerthType[];

  return (
    <div className="min-h-screen gradient-bg">
      <Header />

      <div className="max-w-7xl mx-auto px-5 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Panel: Info & Summary */}
          <div className="lg:w-80 shrink-0 space-y-6">
            <div className="glass-card p-6 animate-slide-in-left">
              <h2 className="text-2xl font-black text-primary mb-2">{config.title}</h2>
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-bold text-foreground">{bookingData?.train?.number} - {bookingData?.train?.name}</p>
                <p>{bookingData?.from} → {bookingData?.to}</p>
              </div>

              <div className="mt-6 space-y-4">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary mb-2">
                    <Sparkles className="w-3 h-3" />
                    SMART RECOMMENDATION
                  </div>
                  <p className="text-xs leading-relaxed">
                    Coach <strong>{coaches.find(c => c.occupancy === Math.min(...coaches.map(c => c.occupancy)))?.id}</strong> is currently the least crowded.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {legendTypes.map((type) => (
                    <div key={type} className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border">
                      <span className={`w-3 h-3 rounded-sm seat-${type}`} />
                      <span className="text-[10px] font-bold uppercase">{type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {selectedSeats.length > 0 && (
              <div className="glass-card p-6 animate-scale-in border-primary/30 shadow-xl shadow-primary/10">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-black text-lg">Selection</h3>
                  <SeatLockTimer onExpire={() => {
                    toast.error("Seat lock expired. Please re-select.");
                    setSelectedSeats([]);
                  }} />
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Coach</span>
                    <span className="font-bold">{currentCoach?.id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Seats</span>
                    <span className="font-bold">{selectedSeats.join(", ")}</span>
                  </div>
                  <div className="pt-3 border-t border-border flex justify-between items-center">
                    <span className="font-bold">Total Fare</span>
                    <span className="text-xl font-black text-primary">₹{selectedSeats.length * farePerSeat}</span>
                  </div>
                </div>

                <Button onClick={handleProceed} className="w-full py-6 btn-primary-gradient font-black rounded-2xl shadow-lg shadow-primary/20">
                  Confirm & Continue
                </Button>
              </div>
            )}
          </div>

          {/* Right Panel: Coach Selection & Layout */}
          <div className="flex-1 space-y-6">
            {/* Coach Selector with Heatmap */}
            <div className="glass-card p-6 animate-panel-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Select Coach
                </h3>
                <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Low</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Med</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> High</span>
                </div>
              </div>
              <CoachSelector 
                coaches={coaches} 
                selectedId={currentCoach?.id || ""} 
                onSelect={setCurrentCoach} 
              />
            </div>

            {/* Interactive Seat Map */}
            <div className="glass-card p-8 animate-scale-in overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="flex items-center justify-center gap-12">
                  {/* Main Compartments */}
                  <div 
                    className="grid gap-6 p-8 border-x-8 border-primary/20 rounded-3xl bg-gradient-to-b from-primary/5 to-transparent"
                    style={{ gridTemplateColumns: `repeat(${config.gridCols}, minmax(80px, 1fr))` }}
                  >
                    {mainSeats.map(({ num, type }, idx) => (
                      <div key={num} className="animate-scale-in" style={{ animationDelay: `${idx * 10}ms` }}>
                        <SeatButton
                          number={num}
                          type={type}
                          isBooked={bookedSeats.includes(num)}
                          isSelected={selectedSeats.includes(num)}
                          onClick={() => toggleSeat(num, type)}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Side Berths */}
                  {config.hasSide && (
                    <div className="flex flex-col gap-6 p-4 border-l-4 border-dashed border-primary/20">
                      {sideSeats.map(({ num, type }, idx) => (
                        <div key={num} className="animate-scale-in" style={{ animationDelay: `${(mainSeats.length + idx) * 10}ms` }}>
                          <SeatButton
                            number={num}
                            type={type}
                            isBooked={bookedSeats.includes(num)}
                            isSelected={selectedSeats.includes(num)}
                            onClick={() => toggleSeat(num, type)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
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