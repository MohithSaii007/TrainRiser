import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import { Train, ScheduleEntry, FARES } from "@/types/booking";
import { Button } from "@/components/ui/button";

const Results = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const date = searchParams.get("date") || "";

  const [trains, setTrains] = useState<Train[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoaches, setSelectedCoaches] = useState<Record<string, string>>({});

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
              coaches: ["SL", "3A", "2A", "1A"],
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
    const coach = selectedCoaches[train.number];
    if (!coach) {
      alert("Please select a coach");
      return;
    }

    const bookingData = {
      train,
      from,
      to,
      date,
      coach,
      fare: FARES[coach],
    };
    sessionStorage.setItem("bookingData", JSON.stringify(bookingData));
    navigate(`/seats/${coach.toLowerCase()}`);
  };

  return (
    <div className="min-h-screen gradient-bg">
      <Header />

      <div className="max-w-5xl mx-auto px-5 py-8">
        {/* Search Summary */}
        <div className="glass-card p-6 mb-8">
          <h1 className="text-2xl font-extrabold mb-4">
            Trains from {from} to {to}
          </h1>
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <div>
              <strong>Date:</strong>{" "}
              {new Date(date).toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
            <div>
              <strong>From:</strong> {from}
            </div>
            <div>
              <strong>To:</strong> {to}
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">
            Loading trains...
          </div>
        ) : trains.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            No trains found for this route.
          </div>
        ) : (
          <div className="space-y-5">
            {trains.map((train) => (
              <div key={train.number} className="glass-card p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <div className="text-xl font-extrabold text-primary">
                      {train.number}
                    </div>
                    <div className="text-muted-foreground">{train.name}</div>
                  </div>
                </div>

                {/* Schedule */}
                <div className="flex justify-between mb-6">
                  <div>
                    <div className="text-sm text-muted-foreground">Departure</div>
                    <div className="text-lg font-bold">{train.dep}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Arrival</div>
                    <div className="text-lg font-bold">{train.arr}</div>
                  </div>
                </div>

                {/* Coaches */}
                <div className="flex flex-wrap gap-3 mb-5">
                  {train.coaches.map((coach) => (
                    <button
                      key={coach}
                      onClick={() => handleCoachSelect(train.number, coach)}
                      className={`px-4 py-3 rounded-2xl border transition-all font-semibold ${
                        selectedCoaches[train.number] === coach
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:border-primary/50 hover:bg-primary/10"
                      }`}
                    >
                      {coach}
                      <span className="block text-xs opacity-70">
                        ₹{FARES[coach]}
                      </span>
                    </button>
                  ))}
                </div>

                <Button
                  onClick={() => handleBook(train)}
                  className="w-full py-4 rounded-2xl btn-primary-gradient font-bold"
                >
                  Seat Availability & Book
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
