import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "@/components/Header";
import SeatButton from "@/components/SeatButton";
import { BookingData, BerthType, BERTH_LABELS, COACH_NAMES, FARES } from "@/types/booking";
import { Button } from "@/components/ui/button";

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
  "1a": {
    title: "AC 1st Class",
    totalSeats: 24,
    pattern: ["lb", "ub"],
    hasSide: false,
    sidePattern: [],
    gridCols: 2,
    blocks: 12,
    seatsPerBlock: 2,
  },
  "2a": {
    title: "AC 2 Tier",
    totalSeats: 54,
    pattern: ["lb", "ub", "lb", "ub"],
    hasSide: true,
    sidePattern: ["sl", "su"],
    gridCols: 2,
    blocks: 9,
    seatsPerBlock: 4,
  },
  "3a": {
    title: "AC 3 Tier",
    totalSeats: 72,
    pattern: ["lb", "mb", "ub", "lb", "mb", "ub"],
    hasSide: true,
    sidePattern: ["sl", "su"],
    gridCols: 3,
    blocks: 9,
    seatsPerBlock: 6,
  },
  sl: {
    title: "Sleeper Class",
    totalSeats: 72,
    pattern: ["lb", "mb", "ub", "lb", "mb", "ub"],
    hasSide: true,
    sidePattern: ["sl", "su"],
    gridCols: 3,
    blocks: 9,
    seatsPerBlock: 6,
  },
};

// Random booked seats
const generateBookedSeats = (total: number): number[] => {
  const count = Math.floor(total * 0.15);
  const booked: Set<number> = new Set();
  while (booked.size < count) {
    booked.add(Math.floor(Math.random() * total) + 1);
  }
  return Array.from(booked);
};

const SeatSelection = () => {
  const navigate = useNavigate();
  const { coachType } = useParams<{ coachType: string }>();
  const coach = coachType?.toLowerCase() || "3a";
  const config = coachConfigs[coach] || coachConfigs["3a"];

  const [bookingData, setBookingData] = useState<Partial<BookingData> | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [seatTypes, setSeatTypes] = useState<Record<number, BerthType>>({});
  const [bookedSeats] = useState(() => generateBookedSeats(config.totalSeats));

  useEffect(() => {
    const data = sessionStorage.getItem("bookingData");
    if (data) {
      setBookingData(JSON.parse(data));
    } else {
      navigate("/");
    }
  }, [navigate]);

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
      setSelectedSeats((prev) => [...prev, num]);
      setSeatTypes((prev) => ({ ...prev, [num]: type }));
    }
  };

  const handleProceed = () => {
    if (selectedSeats.length === 0) {
      alert("Please select at least one seat");
      return;
    }

    const farePerSeat = FARES[coach.toUpperCase()] || 460;
    const updatedData = {
      ...bookingData,
      seats: selectedSeats.sort((a, b) => a - b),
      seatTypes,
      farePerSeat,
      totalFare: selectedSeats.length * farePerSeat,
    };
    sessionStorage.setItem("bookingData", JSON.stringify(updatedData));
    navigate("/passengers");
  };

  // Generate seats
  const generateSeats = () => {
    const mainSeats: { num: number; type: BerthType }[] = [];
    const sideSeats: { num: number; type: BerthType }[] = [];
    let seatNo = 1;

    for (let block = 0; block < config.blocks; block++) {
      // Main seats
      for (let i = 0; i < config.seatsPerBlock; i++) {
        const typeIndex = i % config.pattern.length;
        mainSeats.push({ num: seatNo, type: config.pattern[typeIndex] });
        seatNo++;
      }
      // Side seats
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
  const farePerSeat = FARES[coach.toUpperCase()] || 460;

  // Get unique berth types for legend
  const legendTypes = [...new Set([...config.pattern, ...config.sidePattern])] as BerthType[];

  return (
    <div className="min-h-screen gradient-bg">
      <Header />

      <div className="max-w-7xl mx-auto px-5 py-8 animate-fade-in">
        <div className="glass-card p-8 flex flex-col lg:flex-row gap-10">
          {/* Info Panel */}
          <div className="lg:w-80 shrink-0 animate-slide-in-left">
            <h2 className="text-2xl font-extrabold text-primary mb-4">
              {config.title}
            </h2>
            {bookingData?.train && (
              <div className="mb-4 text-sm">
                <p className="text-muted-foreground">
                  <strong className="text-foreground">{bookingData.train.number}</strong> - {bookingData.train.name}
                </p>
                <p className="text-muted-foreground mt-1">
                  {bookingData.from} → {bookingData.to}
                </p>
              </div>
            )}
            <p className="text-muted-foreground mb-2">
              <strong>Class Code:</strong> {coach.toUpperCase()}
            </p>
            <p className="text-muted-foreground">
              <strong>Total Seats:</strong> {config.totalSeats}
            </p>

            {/* Legend */}
            <div className="mt-6 border border-border rounded-xl bg-card/50 overflow-hidden">
              {legendTypes.map((type, index) => (
                <div
                  key={type}
                  className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 transition-all duration-300 hover:bg-primary/5"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <span className={`w-5 h-5 rounded seat-${type} border border-black shadow-sm`} />
                  <span className="text-sm">{BERTH_LABELS[type]}</span>
                </div>
              ))}
              <div className="flex items-center gap-3 px-4 py-3 transition-all duration-300 hover:bg-primary/5">
                <span className="w-5 h-5 rounded seat-booked border border-black" />
                <span className="text-sm">Already Booked</span>
              </div>
            </div>

            {/* Selection Summary */}
            <div className="mt-6 p-5 rounded-xl bg-gradient-to-br from-background to-primary/10 border border-border transition-all duration-300">
              <h3 className="text-lg font-bold text-primary mb-3">Booking Summary</h3>
              {selectedSeats.length > 0 ? (
                <div className="text-sm space-y-2 animate-fade-in">
                  <p>
                    <strong>Seats:</strong> {selectedSeats.sort((a, b) => a - b).join(", ")}
                  </p>
                  <p>
                    <strong>Coach:</strong> {coach.toUpperCase()}
                  </p>
                  <p className="text-lg font-bold text-primary">
                    Total: ₹{selectedSeats.length * farePerSeat}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No seats selected</p>
              )}

              {selectedSeats.length > 0 && (
                <Button
                  onClick={handleProceed}
                  className="w-full mt-4 btn-primary-gradient font-bold py-4 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25"
                >
                  Continue to Passenger Details
                </Button>
              )}
            </div>
          </div>

          {/* Coach Layout */}
          <div className="flex-1 animate-scale-in">
            {/* Coach Header */}
            <div className="text-center mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30">
              <h3 className="text-lg font-bold text-primary">Coach Layout</h3>
              <p className="text-sm text-muted-foreground">Tap on a seat to select</p>
            </div>

            {/* Seats */}
            <div className="flex justify-center">
              {/* Main Seats */}
              <div
                className="grid gap-4 p-6 border-l-4 border-r-4 border-primary rounded-lg bg-gradient-to-b from-primary/5 to-transparent"
                style={{
                  gridTemplateColumns: `repeat(${config.gridCols}, minmax(70px, 1fr))`,
                }}
              >
                {mainSeats.map(({ num, type }, index) => (
                  <div
                    key={num}
                    className="animate-scale-in"
                    style={{ animationDelay: `${index * 20}ms` }}
                  >
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

              {/* Side Seats */}
              {config.hasSide && sideSeats.length > 0 && (
                <div className="flex flex-col gap-4 ml-6 p-4 border-l-2 border-dashed border-primary/50">
                  {sideSeats.map(({ num, type }, index) => (
                    <div
                      key={num}
                      className="animate-scale-in"
                      style={{ animationDelay: `${(mainSeats.length + index) * 20}ms` }}
                    >
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
  );
};

export default SeatSelection;
