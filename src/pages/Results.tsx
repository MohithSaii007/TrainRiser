import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import { Train, ScheduleEntry, FARES, COACH_NAMES } from "@/types/booking";
import { Button } from "@/components/ui/button";
import { TrendingUp, ShieldCheck, Clock, MapPin, AlertCircle } from "lucide-react";
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

        // 2. Dynamic Generation: If few or no matches, generate a full list for this route
        if (matchedTrains.length < 4) {
          const trainTypes = [
            { suffix: "Express", speed: "Superfast", dep: "06:15", arr: "14:30" },
            { suffix: "Shatabdi", speed: "Premium", dep: "07:00", arr: "12:45" },
            { suffix: "Rajdhani", speed: "Premium", dep: "16:50", arr: "08:20" },
            { suffix: "Mail", speed: "Express", dep: "21:30", arr: "05:45" },
            { suffix: "Humsafar", speed: "Superfast", dep: "13:10", arr: "22:15" },
            { suffix: "Duronto", speed: "Non-Stop", dep: "19:00", arr: "04:30" }
          ];

          const existingNumbers = new Set(matchedTrains.map(t => t.number));
          
          trainTypes.forEach((type, i) => {
            const num = (12000 + (i * 143) + (from.charCodeAt(0) * 2)).toString();
            if (!existingNumbers.has(num) && matchedTrains.length < 6) {
              matchedTrains.push({
                number: num,
                name: `${from}-${to} ${type.suffix}`,
                dep: type.dep,
                arr: type.arr,
                coaches: type.suffix === "Shatabdi" ? ["CC", "1A"] : ["SL", "3A", "2A", "1A"],
                crowdLevel: i % 3 === 0 ? 'low' : i % 3 === 1 ? 'medium' : 'high',
                route: [from, "STN1", "STN2", to]
              });
            }
          });
        }

        // Sort trains by departure time
        matchedTrains.sort((a, b) => a.dep.localeCompare(b.dep));

        // 3. Fetch availability (with fallback to mock values if Firebase fails)
        const availMap: Record<string, any> = {};
        for (const train of matchedTrains) {
          for (const coach of train.coaches) {
            const key = `${train.number}_${coach}`;
            try {
              // Try real database first
              availMap[key] = await getAvailability(train.number, date, coach);
            } catch (e) {
              // Fallback to mock availability
              const isWaitlist = Math.random() > 0.7;
              availMap[key] = {
                available: isWaitlist ? 0 : Math.floor(Math.random() * 40) + 5,
                rac: isWaitlist ? Math.floor(Math.random() * 5) : 0,
                wl: isWaitlist ? Math.floor(Math.random() * 15) + 1 : 0,
                avgOccupancy: 30 + Math.random() * 60
              };
            }
          }
        }
        
        setAvailability(availMap);
        setTrains(matchedTrains);
      } catch (error) {
        console.error("Error in Results page:", error);
        toast.error("Search engine encountered an issue. Loading default route.");
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
        <div className="glass-card p-6 mb-8 animate-fade-in border-primary/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black flex items-center gap-2">
                <MapPin className="w-6 h-6 text-primary" />
                {from} <span className="text-primary">→</span> {to}
              </h1>
              <p className="text-muted-foreground font-semibold mt-1">
                {new Date(date).toLocaleDateString("en-IN", { 
                  weekday: "long", 
                  day: "numeric", 
                  month: "long", 
                  year: "numeric" 
                })}
              </p>
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2 text-sm font-bold">
              {trains.length} Trains Found
            </Badge>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground font-bold animate-pulse">
              Searching live schedules and seat inventory...
            </p>
          </div>
        ) : trains.length === 0 ? (
          <div className="glass-card p-12 text-center animate-scale-in">
            <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Trains Found</h2>
            <p className="text-muted-foreground mb-6">We couldn't find any trains for this route on the selected date.</p>
            <Button onClick={() => navigate("/")} variant="outline">Try Another Search</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {trains.map((train, idx) => (
              <div key={train.number} className="glass-card p-6 animate-panel-in group hover:border-primary/40 transition-all duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-black text-primary group-hover:scale-110 transition-transform inline-block">{train.number}</span>
                      <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10 font-bold">
                        RUNNING DAILY
                      </Badge>
                    </div>
                    <div className="text-lg font-bold mt-1">{train.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 font-bold uppercase tracking-wider">
                      <ShieldCheck className="w-3 h-3 text-primary" />
                      Confirm Prob.
                    </div>
                    <div className="text-lg font-black text-primary">High (92%)</div>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-6 p-5 bg-background/40 rounded-2xl border border-border group-hover:bg-primary/5 transition-colors">
                  <div className="text-center">
                    <div className="text-2xl font-black">{train.dep}</div>
                    <div className="text-xs font-black text-primary uppercase tracking-widest">{from}</div>
                  </div>
                  <div className="flex-1 px-10 relative">
                    <div className="h-0.5 bg-border w-full relative">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary shadow-[0_0_15px_rgba(16,185,129,0.6)]" />
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-muted-foreground uppercase">
                        <Clock className="w-3 h-3 inline mr-1" />
                        8h 15m
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black">{train.arr}</div>
                    <div className="text-xs font-black text-primary uppercase tracking-widest">{to}</div>
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
                        className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left relative overflow-hidden group/btn ${
                          isSelected 
                            ? "bg-primary/10 border-primary shadow-lg shadow-primary/20 scale-[1.02]" 
                            : "border-border hover:border-primary/50 hover:bg-primary/5"
                        }`}
                      >
                        <div className="text-xs text-muted-foreground font-black uppercase tracking-tighter">{coach}</div>
                        <div className="text-xl font-black">₹{FARES[coach]}</div>
                        <div className="text-[10px] mt-1 font-black uppercase">
                          {avail?.available > 0 ? (
                            <span className="text-green-500">Available {avail.available}</span>
                          ) : avail?.rac > 0 ? (
                            <span className="text-yellow-500">RAC {avail.rac}</span>
                          ) : (
                            <span className="text-red-500">Waitlist {avail?.wl || 1}</span>
                          )}
                        </div>
                        {isSelected && (
                          <div className="absolute top-0 right-0 w-6 h-6 bg-primary flex items-center justify-center rounded-bl-lg">
                            <ShieldCheck className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <Button
                  onClick={() => handleBook(train)}
                  className="w-full py-7 rounded-2xl btn-primary-gradient font-black text-xl shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all"
                >
                  Select Seats & Book
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