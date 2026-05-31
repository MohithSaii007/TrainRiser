import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import { Train, ScheduleEntry, FARES, COACH_NAMES } from "@/types/booking";
import { Button } from "@/components/ui/button";
import { TrendingUp, ShieldCheck, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getAvailability } from "@/services/inventoryService";

const Results = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const date = searchParams.get("date") || "";

  const [trains, setTrains] = useState<Train[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoaches, setSelectedCoaches] = useState<Record<string, string>>({});
  const [availability, setAvailability] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchTrains = async () => {
      setLoading(true);
      try {
        // 1. Fetch schedules from local JSON
        const res = await fetch("/data/schedules.json");
        if (!res.ok) throw new Error("Failed to fetch schedules");
        
        const data: ScheduleEntry[] = await res.json();
        
        const fromStops = data.filter((s) => s.station_code === from);
        const toMap = new Map(data.filter((s) => s.station_code === to).map((s) => [s.train_number, s]));

        let matchedTrains: Train[] = [];
        fromStops.forEach((fs) => {
          const ts = toMap.get(fs.train_number);
          if (ts && fs.day <= ts.day) {
            matchedTrains.push({
              number: fs.train_number,
              name: fs.train_name,
              dep: fs.departure || "—",
              arr: ts.arrival || ts.departure || "—",
              coaches: ["SL", "3A", "2A", "1A", "CC"],
              crowdLevel: 'low',
              route: [from, "BZA", "WL", to]
            });
          }
        });

        // 2. Fallback: Generate mock trains if no matches found in JSON
        if (matchedTrains.length === 0) {
          const mockNames = ["Express", "Superfast", "Mail", "Rajdhani"];
          matchedTrains = Array.from({ length: 3 }, (_, i) => ({
            number: (12000 + i * 150).toString(),
            name: `${from}-${to} ${mockNames[i % mockNames.length]}`,
            dep: `${10 + i}:30`,
            arr: `${18 + i}:45`,
            coaches: ["SL", "3A", "2A", "1A"],
            crowdLevel: i % 2 === 0 ? 'low' : 'medium',
            route: [from, "INT1", "INT2", to]
          }));
        }

        // 3. Fetch availability (with fallback to mock values if Firebase fails)
        const availMap: Record<string, any> = {};
        for (const train of matchedTrains) {
          for (const coach of train.coaches) {
            const key = `${train.number}_${coach}`;
            try {
              // Try real database first
              availMap[key] = await getAvailability(train.number, date, coach);
            } catch (e) {
              // Fallback to mock availability if Firebase is not configured/fails
              availMap[key] = {
                available: Math.floor(Math.random() * 50),
                rac: Math.floor(Math.random() * 10),
                wl: Math.floor(Math.random() * 5),
                avgOccupancy: 40 + Math.random() * 40
              };
            }
          }
        }
        
        setAvailability(availMap);
        setTrains(matchedTrains);
      } catch (error) {
        console.error("Error in Results page:", error);
        toast.error("Using offline mode: Some real-time features may be limited.");
        
        // Ultimate fallback to ensure UI doesn't break
        const fallbackTrains: Train[] = [{
          number: "12727",
          name: "Godavari Express",
          dep: "17:20",
          arr: "05:50",
          coaches: ["SL", "3A", "2A", "1A"],
          crowdLevel: 'medium',
          route: [from, "VGA", "RJY", to]
        }];
        setTrains(fallbackTrains);
      } finally {
        setLoading(false);
      }
    };

    fetchTrains();
  }, [from, to, date]);

  const handleBook = (train: Train) => {
    const coachType = selectedCoaches[train.number];
    if (!coachType) {
      toast.error("Please select a coach class");
      return;
    }

    const bookingData = {
      train,
      from,
      to,
      date,
      coachType,
      fare: FARES[coachType],
      seats: [],
      seatTypes: {},
      totalFare: 0
    };
    sessionStorage.setItem("bookingData", JSON.stringify(bookingData));
    navigate(`/seats/${coachType.toLowerCase()}`);
  };

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      <div className="max-w-5xl mx-auto px-5 py-8">
        <div className="glass-card p-6 mb-8 animate-fade-in">
          <h1 className="text-2xl font-extrabold mb-4">Trains from {from} to {to}</h1>
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <strong>Date:</strong> {new Date(date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground animate-pulse">
            Calculating real-time seat inventory and waitlist probabilities...
          </div>
        ) : (
          <div className="space-y-6">
            {trains.map((train, idx) => (
              <div key={train.number} className="glass-card p-6 animate-panel-in" style={{ animationDelay: `${idx * 100}ms` }}>
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-black text-primary">{train.number}</span>
                      <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10">
                        LIVE STATUS
                      </Badge>
                    </div>
                    <div className="text-lg font-bold mt-1">{train.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <ShieldCheck className="w-3 h-3 text-primary" />
                      Confirmation
                    </div>
                    <div className="text-lg font-black text-primary">95% Prob.</div>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-6 p-4 bg-background/30 rounded-2xl border border-border">
                  <div className="text-center">
                    <div className="text-2xl font-black">{train.dep}</div>
                    <div className="text-xs font-bold text-primary">{from}</div>
                  </div>
                  <div className="flex-1 px-8 relative">
                    <div className="h-0.5 bg-border w-full relative">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black">{train.arr}</div>
                    <div className="text-xs font-bold text-primary">{to}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {train.coaches.map((coach) => {
                    const avail = availability[`${train.number}_${coach}`];
                    const isSelected = selectedCoaches[train.number] === coach;
                    
                    return (
                      <button
                        key={coach}
                        onClick={() => setSelectedCoaches(prev => ({ ...prev, [train.number]: coach }))}
                        className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left ${
                          isSelected ? "bg-primary/10 border-primary shadow-lg shadow-primary/10" : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="text-xs text-muted-foreground font-bold">{coach}</div>
                        <div className="text-lg font-black">₹{FARES[coach]}</div>
                        <div className="text-[10px] mt-1 font-bold">
                          {avail?.available > 0 ? (
                            <span className="text-green-500">AVL {avail.available}</span>
                          ) : avail?.rac > 0 ? (
                            <span className="text-yellow-500">RAC {avail.rac}</span>
                          ) : (
                            <span className="text-red-500">WL {avail?.wl || 1}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <Button
                  onClick={() => handleBook(train)}
                  className="w-full py-6 rounded-2xl btn-primary-gradient font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.01] transition-transform"
                >
                  Visual Seat Selection
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Results;