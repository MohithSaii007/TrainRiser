import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "@/components/Header";
import SeatButton from "@/components/SeatButton";
import CoachSelector from "@/components/CoachSelector";
import SeatLockTimer from "@/components/SeatLockTimer";
import { BookingData, BerthType, BERTH_LABELS, COACH_NAMES, FARES, CoachData, SeatStatus } from "@/types/booking";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Info, Sparkles, Users, MapPin, Accessibility, Group } from "lucide-react";
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
  const [isLocking, setIsLocking] = useState(false);

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
  }, [navigate, coachClass, config.totalSeats]);

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

  const toggleSeat = async (num: number, type: BerthType) => {
    const seatStatus = realTimeSeats[num];
    if (seatStatus?.status === 'booked' || (seatStatus?.status === 'locked' && seatStatus.lockedBy !== user?.uid)) {
      toast.error("Seat is currently unavailable");
      return;
    }

    if (selectedSeats.includes(num)) {
      setSelectedSeats((prev) => prev.filter((n) => n !== num));
      setSeatTypes((prev) => {
        const newTypes = { ...prev };
        delete newTypes[num];
        return newTypes;
      });
      if (user) await releaseSeats(bookingData!.train.number, currentCoach!.id, [num], user.uid);
    } else {
      if (selectedSeats.length >= 6) {
        toast.error("Maximum 6 seats per booking");
        return;
      }
      
      setIsLocking(true);
      try {
        if (user) {
          await lockSeats(bookingData!.train.number, currentCoach!.id, [num], user.uid);
          setSelectedSeats((prev) => [...prev, num]);
          setSeatTypes((prev) => ({ ...prev, [num]: type }));
        } else {
          toast.error("Please login to select seats");
          navigate("/auth");
        }
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setIsLocking(false);
      }
    }
  };

  const selectCluster = async (startNum: number) => {
    // Select 4 seats in a cluster (e.g., 1, 2, 3, 4)
    const cluster = [startNum, startNum + 1, startNum + 2, startNum + 3].filter(n => n <= config.totalSeats);
    if (selectedSeats.length + cluster.length > 6) {
      toast.error("Cluster exceeds 6 seat limit");
      return;
    }

    setIsLocking(true);
    try {
      if (user) {
        await lockSeats(bookingData!.train.number, currentCoach!.id, cluster, user.uid);
        setSelectedSeats(prev => [...new Set([...prev, ...cluster])]);
        toast.success("Family cluster locked!");
      }
    } catch (error: any) {
      toast.error("Some seats in this cluster are unavailable");
    } finally {
      setIsLocking(false);
    }
  };

  const handleProceed = () => {
    if (selectedSeats.length === 0) {
      toast.error("Please select at least one seat");
      return;
    }

    const farePerSeat = FARES[coachClass.toUpperCase()] || 460;
    const updatedData = {
      ...bookingData!,
      coach: currentCoach?.id || "",
      seats: selectedSeats.sort((a, b) => a - b),
      seatTypes,
      fare: farePerSeat,
      totalFare: selectedSeats.length * farePerSeat,
      lockExpiresAt: Date.now() + 300000,
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
  const legendTypes = [...new Set([...config.pattern, ...config.sidePattern])] as BerthType[];

  return (
    <div className="min-h-screen gradient-bg">
      <Header />

      <div className="max-w-7xl mx-auto px-5 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          <div className="lg:w-80 shrink-0 space-y-6">
            <div className="glass-card p-6 animate-slide-in-left">
              <h2 className="text-2xl font-black text-primary mb-2">{config.title}</h2>
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-bold text-foreground">{bookingData?.train?.number} - {bookingData?.train?.name}</p>
                <div className="flex items-center gap-2 mt-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>{bookingData?.from} → {bookingData?.to}</span>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary mb-2">
                    <Accessibility className="w-3 h-3" />
                    ACCESSIBILITY INFO
                  </div>
                  <p className="text-xs leading-relaxed">
                    Lower berths 1-4 are reserved for elderly and wheelchair assistance.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {legendTypes.map((type) => (
                    <div key={type} className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border">
                      <span className={`w-3 h-3 rounded-sm seat-${type}`} />
                      <span className="text-[10px] font-bold uppercase">{type}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border">
                    <span className="w-3 h-3 rounded-sm bg-red-500" />
                    <span className="text-[10px] font-bold uppercase">Booked</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border">
                    <span className="w-3 h-3 rounded-sm bg-yellow-400" />
                    <span className="text-[10px] font-bold uppercase">RAC</span>
                  </div>
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
                    <span className="text-xl font-black text-primary">₹{selectedSeats.length * (bookingData?.fare || 0)}</span>
                  </div>
                </div>

                <Button onClick={handleProceed} className="w-full py-6 btn-primary-gradient font-black rounded-2xl shadow-lg shadow-primary/20">
                  Confirm & Continue
                </Button>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-6">
            <div className="glass-card p-6 animate-panel-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Select Coach
                </h3>
                <Button variant="outline" size="sm" className="text-[10px] font-black uppercase tracking-widest border-primary/30 text-primary" onClick={() => selectCluster(1)}>
                  <Group className="w-3 h-3 mr-2" />
                  Quick Family Cluster
                </Button>
              </div>
              <CoachSelector 
                coaches={coaches} 
                selectedId={currentCoach?.id || ""} 
                onSelect={setCurrentCoach} 
              />
            </div>

            <div className="glass-card p-8 animate-scale-in overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="flex items-center justify-center gap-12">
                  <div 
                    className="grid gap-6 p-8 border-x-8 border-primary/20 rounded-3xl bg-gradient-to-b from-primary/5 to-transparent"
                    style={{ gridTemplateColumns: `repeat(${config.gridCols}, minmax(80px, 1fr))` }}
                  >
                    {mainSeats.map(({ num, type }, idx) => {
                      const status = realTimeSeats[num]?.status || 'available';
                      const isLockedByMe = realTimeSeats[num]?.lockedBy === user?.uid;
                      return (
                        <div key={num} className="animate-scale-in" style={{ animationDelay: `${idx * 10}ms` }}>
                          <SeatButton
                            number={num}
                            type={type}
                            isBooked={status === 'booked'}
                            isLocked={status === 'locked' && !isLockedByMe}
                            isRAC={status === 'rac'}
                            isWL={status === 'wl'}
                            isSelected={selectedSeats.includes(num)}
                            onClick={() => toggleSeat(num, type)}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {config.hasSide && (
                    <div className="flex flex-col gap-6 p-4 border-l-4 border-dashed border-primary/20">
                      {sideSeats.map(({ num, type }, idx) => {
                        const status = realTimeSeats[num]?.status || 'available';
                        const isLockedByMe = realTimeSeats[num]?.lockedBy === user?.uid;
                        return (
                          <div key={num} className="animate-scale-in" style={{ animationDelay: `${(mainSeats.length + idx) * 10}ms` }}>
                            <SeatButton
                              number={num}
                              type={type}
                              isBooked={status === 'booked'}
                              isLocked={status === 'locked' && !isLockedByMe}
                              isRAC={status === 'rac'}
                              isWL={status === 'wl'}
                              isSelected={selectedSeats.includes(num)}
                              onClick={() => toggleSeat(num, type)}
                            />
                          </div>
                        );
                      })}
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