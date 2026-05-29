import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import RouteMap from "@/components/RouteMap";
import { Train, ScheduleEntry, FARES, COACH_NAMES } from "@/types/booking";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, Sparkles, Info, Clock, ShieldCheck, Map as MapIcon, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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

  useEffect(() => {
    fetch("/data/schedules.json")
      .then((res) => res.json())
      .then((data: ScheduleEntry[]) => {
        const fromStops = data.filter((s) => s.station_code === from);
        const toMap = new Map(
          data.filter((s) => s.station_code === to).map((s) => [s.train_number, s])
        );

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
              crowdLevel: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
              confirmationProb: Math.floor(Math.random() * 40) + 60,
              route: [from, "BZA", "WL", to] // Mock route
            });
          }
        });
        setTrains(matchedTrains);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [from, to]);

  const handleCoachSelect = (trainNumber: string, coach: string) => {
    setSelectedCoaches((prev) => ({
      ...prev,
      [trainNumber]: coach,
    }));
  };

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

  const mockStops = [
    { station: "Chennai Central", code: "MAS", arrival: "Start", departure: "22:00", occupancy: 85 },
    { station: "Vijayawada", code: "BZA", arrival: "04:15", departure: "04:30", occupancy: 65 },
    { station: "Warangal", code: "WL", arrival: "07:20", departure: "07:22", occupancy: 45 },
    { station: "New Delhi", code: "NDLS", arrival: "20:00", departure: "End", occupancy: 20 },
  ];

  return (
    <div className="min-h-screen gradient-bg">
      <Header />

      <div className="max-w-5xl mx-auto px-5 py-8">
        <div className="glass-card p-6 mb-8 animate-fade-in">
          <h1 className="text-2xl font-extrabold mb-4">
            Trains from {from} to {to}
          </h1>
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <strong>Date:</strong> {new Date(date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <strong>Route:</strong> {from} → {to}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground animate-pulse">
            Analyzing live train data and occupancy heatmaps...
          </div>
        ) : trains.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            No trains found for this route.
          </div>
        ) : (
          <div className="space-y-6">
            {trains.map((train, idx) => (
              <div key={train.number} className="glass-card p-6 animate-panel-in" style={{ animationDelay: `${idx * 100}ms` }}>
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-black text-primary">{train.number}</span>
                      <Badge variant="outline" className={
                        train.crowdLevel === 'low' ? 'text-green-500 border-green-500/30 bg-green-500/10' :
                        train.crowdLevel === 'medium' ? 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10' :
                        'text-red-500 border-red-500/30 bg-red-500/10'
                      }>
                        {train.crowdLevel.toUpperCase()} CROWD
                      </Badge>
                    </div>
                    <div className="text-lg font-bold mt-1">{train.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <ShieldCheck className="w-3 h-3 text-primary" />
                      WL Confirmation
                    </div>
                    <div className="text-lg font-black text-primary">{train.confirmationProb}% Prob.</div>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-4 p-4 bg-background/30 rounded-2xl border border-border">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Departure</div>
                    <div className="text-2xl font-black">{train.dep}</div>
                    <div className="text-xs font-bold text-primary">{from}</div>
                  </div>
                  <div className="flex-1 px-8 relative">
                    <div className="h-0.5 bg-border w-full relative">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Arrival</div>
                    <div className="text-2xl font-black">{train.arr}</div>
                    <div className="text-xs font-bold text-primary">{to}</div>
                  </div>
                </div>

                <button 
                  onClick={() => setExpandedRoute(expandedRoute === train.number ? null : train.number)}
                  className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest mb-6 hover:underline"
                >
                  <MapIcon className="w-3 h-3" />
                  {expandedRoute === train.number ? "Hide Live Route" : "View Live Route & Occupancy"}
                  {expandedRoute === train.number ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {expandedRoute === train.number && (
                  <div className="mb-8 p-6 rounded-2xl bg-background/50 border border-border animate-accordion-down">
                    <RouteMap stops={mockStops} currentStationCode={from} />
                  </div>
                )}

                {selectedCoaches[train.number] === 'SL' && (
                  <div className="mb-5 p-3 bg-primary/10 border border-primary/30 rounded-xl flex items-center justify-between animate-fade-in">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span>Upgrade to 3A for just ₹{FARES['3A'] - FARES['SL']} more!</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleCoachSelect(train.number, '3A')} className="text-primary font-black">
                      UPGRADE
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                  {train.coaches.map((coach) => (
                    <button
                      key={coach}
                      onClick={() => handleCoachSelect(train.number, coach)}
                      className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left ${
                        selectedCoaches[train.number] === coach
                          ? "bg-primary/10 border-primary shadow-lg shadow-primary/10"
                          : "border-border hover:border-primary/50 hover:bg-primary/5"
                      }`}
                    >
                      <div className="text-xs text-muted-foreground font-bold">{coach}</div>
                      <div className="text-lg font-black">₹{FARES[coach]}</div>
                      <div className="flex items-center gap-1 text-[10px] mt-1 opacity-70">
                        <Clock className="w-2 h-2" />
                        {Math.random() > 0.5 ? 'Available' : 'WL 12'}
                      </div>
                    </button>
                  ))}
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