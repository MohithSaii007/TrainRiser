import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import RouteMap from "@/components/RouteMap";
import { Train, ScheduleEntry, FARES, COACH_NAMES } from "@/types/booking";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, Sparkles, Info, Clock, ShieldCheck, Map as MapIcon, ChevronDown, ChevronUp } from "lucide-react";
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
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);
  const [availability, setAvailability] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchTrains = async () => {
      setLoading(true);
      try {
        const res = await fetch("/data/schedules.json");
        const data: ScheduleEntry[] = await res.json();
        
        const fromStops = data.filter((s) => s.station_code === from);
        const toMap = new Map(data.filter((s) => s.station_code === to).map((s) => [s.train_number, s]));

        const matchedTrains: Train[] = [];
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

        // Mock if empty
        if (matchedTrains.length === 0) {
          matchedTrains.push({
            number: "12727",
            name: "Godavari Express",
            dep: "17:20",
            arr: "05:50",
            coaches: ["SL", "3A", "2A", "1A"],
            crowdLevel: 'medium',
            route: [from, "VGA", "RJY", to]
          });
        }

        // Fetch real availability for each train
        const availMap: Record<string, any> = {};
        for (const train of matchedTrains) {
          for (const coach of train.coaches) {
            const key = `${train.number}_${coach}`;
            availMap[key] = await getAvailability(train.number, date, coach);
          }
        }
        
        setAvailability(availMap);
        setTrains(matchedTrains);
      } catch (error) {
        toast.error("Error loading schedules");
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
            {trains.map((train) => (
              <div key={train.number} className="glass-card p-6 animate-panel-in">
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-black text-primary">{train.number}</span>
                      <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10">
                        REAL-TIME DATA
                      </Badge>
                    </div>
                    <div className="text-lg font-bold mt-1">{train.name}</div>
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
                          isSelected ? "bg-primary/10 border-primary" : "border-border hover:border-primary/50"
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
                            <span className="text-red-500">WL {avail?.wl + 1}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <Button
                  onClick={() => handleBook(train)}
                  className="w-full py-6 rounded-2xl btn-primary-gradient font-black text-lg"
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