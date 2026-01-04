import { useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle, XCircle, Clock, Train } from "lucide-react";

interface PnrResult {
  pnr: string;
  status: "confirmed" | "waiting" | "cancelled";
  trainNumber: string;
  trainName: string;
  from: string;
  to: string;
  date: string;
  passengers: {
    name: string;
    seat: string;
    status: string;
  }[];
}

const PnrStatus = () => {
  const [pnrInput, setPnrInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<PnrResult | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = () => {
    if (!pnrInput.trim()) return;
    
    setIsSearching(true);
    setNotFound(false);
    
    // Simulate API call
    setTimeout(() => {
      // Check if there's a stored booking with this PNR
      const storedPnr = sessionStorage.getItem("pnrNumber");
      const storedBooking = sessionStorage.getItem("bookingData");
      
      if (storedPnr && storedPnr === pnrInput.toUpperCase() && storedBooking) {
        const booking = JSON.parse(storedBooking);
        setResult({
          pnr: storedPnr,
          status: "confirmed",
          trainNumber: booking.train.number,
          trainName: booking.train.name,
          from: booking.from,
          to: booking.to,
          date: booking.date,
          passengers: booking.passengers?.map((p: { name: string; seatNumber: number }) => ({
            name: p.name,
            seat: `Seat ${p.seatNumber}`,
            status: "Confirmed",
          })) || [],
        });
      } else {
        // Generate mock data for demo purposes
        if (pnrInput.length >= 8) {
          const statuses = ["confirmed", "waiting", "cancelled"] as const;
          const randomStatus = statuses[Math.floor(Math.random() * 3)];
          
          setResult({
            pnr: pnrInput.toUpperCase(),
            status: randomStatus,
            trainNumber: "12301",
            trainName: "Rajdhani Express",
            from: "NDLS",
            to: "HWH",
            date: new Date().toISOString(),
            passengers: [
              { name: "John Doe", seat: "B1-45", status: randomStatus === "confirmed" ? "Confirmed" : randomStatus === "waiting" ? "WL/12" : "Cancelled" },
              { name: "Jane Doe", seat: "B1-46", status: randomStatus === "confirmed" ? "Confirmed" : randomStatus === "waiting" ? "WL/13" : "Cancelled" },
            ],
          });
        } else {
          setNotFound(true);
          setResult(null);
        }
      }
      setIsSearching(false);
    }, 1500);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case "waiting":
        return <Clock className="w-6 h-6 text-yellow-500" />;
      case "cancelled":
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "text-green-500 bg-green-500/10";
      case "waiting":
        return "text-yellow-500 bg-yellow-500/10";
      case "cancelled":
        return "text-red-500 bg-red-500/10";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      
      <div className="max-w-2xl mx-auto px-5 py-12 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-primary mb-2">PNR Status</h1>
          <p className="text-muted-foreground">Enter your 10-digit PNR number to check booking status</p>
        </div>

        {/* Search Box */}
        <div className="glass-card p-6 mb-8">
          <div className="flex gap-3">
            <Input
              value={pnrInput}
              onChange={(e) => setPnrInput(e.target.value.toUpperCase())}
              placeholder="Enter PNR Number"
              className="flex-1 text-lg py-6 bg-background/50 border-border focus:border-primary transition-all duration-300"
              maxLength={12}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching || !pnrInput.trim()}
              className="btn-primary-gradient px-8 py-6 font-bold transition-all duration-300 hover:scale-105"
            >
              {isSearching ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Not Found Message */}
        {notFound && (
          <div className="glass-card p-8 text-center animate-fade-in">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">PNR Not Found</h3>
            <p className="text-muted-foreground">
              Please check your PNR number and try again.
            </p>
          </div>
        )}

        {/* Result Card */}
        {result && (
          <div className="glass-card overflow-hidden animate-scale-in">
            {/* Status Header */}
            <div className={`p-6 flex items-center justify-between ${
              result.status === "confirmed" ? "bg-green-500/10" :
              result.status === "waiting" ? "bg-yellow-500/10" : "bg-red-500/10"
            }`}>
              <div className="flex items-center gap-3">
                {getStatusIcon(result.status)}
                <div>
                  <p className="text-sm text-muted-foreground">PNR Number</p>
                  <p className="text-xl font-mono font-bold">{result.pnr}</p>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-full font-semibold capitalize ${getStatusColor(result.status)}`}>
                {result.status}
              </div>
            </div>

            {/* Train Details */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-3 mb-4">
                <Train className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-bold text-lg">{result.trainNumber} - {result.trainName}</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">From</p>
                  <p className="text-xl font-bold">{result.from}</p>
                </div>
                <div className="text-2xl text-muted-foreground">→</div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">To</p>
                  <p className="text-xl font-bold">{result.to}</p>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">Journey Date</p>
                <p className="font-semibold">
                  {new Date(result.date).toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Passengers */}
            <div className="p-6">
              <h3 className="font-bold mb-4 text-muted-foreground">Passenger Details</h3>
              <div className="space-y-3">
                {result.passengers.map((p, i) => (
                  <div 
                    key={i} 
                    className="flex justify-between items-center p-4 bg-background/50 rounded-xl border border-border animate-fade-in"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-sm text-muted-foreground">{p.seat}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      p.status.includes("Confirmed") ? "text-green-500 bg-green-500/10" :
                      p.status.includes("WL") ? "text-yellow-500 bg-yellow-500/10" :
                      "text-red-500 bg-red-500/10"
                    }`}>
                      {p.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PnrStatus;
