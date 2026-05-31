import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Train, FARES } from "@/types/booking";
import { Button } from "@/components/ui/button";
import { Train as TrainIcon, Search, ArrowRight, Star, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AllTrains = () => {
  const navigate = useNavigate();
  const [trains, setTrains] = useState<Train[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/data/schedules.json")
      .then((res) => res.json())
      .then((data) => {
        // Group by train number to get unique trains
        const uniqueTrainsMap = new Map();
        data.forEach((entry: any) => {
          if (!uniqueTrainsMap.has(entry.train_number)) {
            uniqueTrainsMap.set(entry.train_number, {
              number: entry.train_number,
              name: entry.train_name,
              dep: entry.departure || "TBA",
              arr: entry.arrival || "TBA",
              duration: "Varies",
              fromStation: "Multiple",
              toStation: "Multiple",
              coaches: ["SL", "3A", "2A", "1A"],
              crowdLevel: 'medium',
              rating: 4.0 + Math.random(),
              onTime: "90%",
              meals: true,
              availability: {
                SL: { status: "Available", count: 100, color: 'green' },
                "3A": { status: "Available", count: 20, color: 'green' }
              }
            });
          }
        });
        setTrains(Array.from(uniqueTrainsMap.values()));
        setLoading(false);
      });
  }, []);

  const filteredTrains = trains.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.number.includes(searchQuery)
  );

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      <main className="max-w-5xl mx-auto px-5 py-10">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-black text-primary">All Trains</h1>
            <p className="text-muted-foreground">Browse the complete Indian Railway fleet</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-card/50 border border-border focus:border-primary outline-none transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground animate-pulse">
            Loading train database...
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredTrains.map((train) => (
              <div key={train.number} className="glass-card p-6 hover:scale-[1.01] transition-transform cursor-pointer" onClick={() => navigate(`/?train=${train.number}`)}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                      <TrainIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-primary">{train.number}</span>
                        <h3 className="text-xl font-bold">{train.name}</h3>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {train.rating.toFixed(1)}</span>
                        <span>On-time: {train.onTime}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-primary font-bold">
                    BOOK NOW <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AllTrains;