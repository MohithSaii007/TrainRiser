import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Station } from "@/types/booking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [stations, setStations] = useState<Station[]>([]);
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [fromCode, setFromCode] = useState("");
  const [toCode, setToCode] = useState("");
  const [dateValue, setDateValue] = useState("");
  const [showFromList, setShowFromList] = useState(false);
  const [showToList, setShowToList] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set tomorrow as default date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDateValue(tomorrow.toISOString().split("T")[0]);

    // Load stations
    fetch("/data/stations.json")
      .then((res) => res.json())
      .then((data) => {
        const stationList = data.features
          .map((f: { properties: { code: string; name: string } }) => f.properties)
          .filter((s: Station) => s.code && s.name)
          .map((s: Station) => ({
            code: s.code.toUpperCase(),
            name: s.name,
          }));
        setStations(stationList);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fromRef.current && !fromRef.current.contains(e.target as Node)) {
        setShowFromList(false);
      }
      if (toRef.current && !toRef.current.contains(e.target as Node)) {
        setShowToList(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const filterStations = (query: string) => {
    const q = query.toLowerCase();
    return stations.filter(
      (s) => s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    ).slice(0, 8);
  };

  const handleSearch = () => {
    if (!user) {
      toast.error("Please login to search trains");
      navigate("/auth");
      return;
    }

    if (!fromCode || !toCode || !dateValue) {
      alert("Please fill all fields");
      return;
    }
    if (fromCode === toCode) {
      alert("From and To cannot be the same");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      navigate(`/results?from=${fromCode}&to=${toCode}&date=${dateValue}`);
    }, 500);
  };

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      
      <section className="min-h-[calc(100vh-80px)] flex items-center justify-center px-5 py-10">
        <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Hero Text */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight">
              Your Journey<br />
              <span className="text-gradient">Starts Here</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-md mx-auto lg:mx-0">
              Search trains, compare schedules, and book confidently — faster than ever.
            </p>
          </div>

          {/* Booking Panel */}
          <div className="glass-panel p-8 md:p-10 animate-panel-in">
            <h2 className="text-2xl font-extrabold mb-8">Search Trains</h2>

            {/* From Station */}
            <div className="mb-6 relative" ref={fromRef}>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">
                From Station
              </label>
              <Input
                value={fromValue}
                onChange={(e) => {
                  setFromValue(e.target.value);
                  setShowFromList(e.target.value.length >= 2);
                  setFromCode("");
                }}
                onFocus={() => fromValue.length >= 2 && setShowFromList(true)}
                placeholder="TPTY - Tirupati"
                className="w-full py-5 px-5 rounded-2xl bg-background border-border text-foreground font-semibold focus:border-primary focus:ring-primary/25"
              />
              {showFromList && fromValue.length >= 2 && (
                <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-xl overflow-hidden shadow-lg">
                  {filterStations(fromValue).map((s) => (
                    <div
                      key={s.code}
                      className="px-4 py-3 cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={() => {
                        setFromValue(`${s.code} - ${s.name}`);
                        setFromCode(s.code);
                        setShowFromList(false);
                      }}
                    >
                      <strong>{s.code}</strong> - {s.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* To Station */}
            <div className="mb-6 relative" ref={toRef}>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">
                To Station
              </label>
              <Input
                value={toValue}
                onChange={(e) => {
                  setToValue(e.target.value);
                  setShowToList(e.target.value.length >= 2);
                  setToCode("");
                }}
                onFocus={() => toValue.length >= 2 && setShowToList(true)}
                placeholder="MAS - Chennai"
                className="w-full py-5 px-5 rounded-2xl bg-background border-border text-foreground font-semibold focus:border-primary focus:ring-primary/25"
              />
              {showToList && toValue.length >= 2 && (
                <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-xl overflow-hidden shadow-lg">
                  {filterStations(toValue).map((s) => (
                    <div
                      key={s.code}
                      className="px-4 py-3 cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={() => {
                        setToValue(`${s.code} - ${s.name}`);
                        setToCode(s.code);
                        setShowToList(false);
                      }}
                    >
                      <strong>{s.code}</strong> - {s.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Date */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-muted-foreground mb-2">
                Journey Date
              </label>
              <Input
                type="date"
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
                className="w-full py-5 px-5 rounded-2xl bg-background border-border text-foreground font-semibold focus:border-primary focus:ring-primary/25"
              />
            </div>

            <Button
              onClick={handleSearch}
              disabled={isLoading || loading}
              className="w-full py-6 text-lg font-black rounded-2xl btn-primary-gradient hover:scale-[1.02] transition-transform"
            >
              {isLoading ? "Searching..." : "Find Trains"}
            </Button>
            
            {!user && !loading && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                Please <button onClick={() => navigate("/auth")} className="text-primary font-semibold hover:underline">login</button> to search trains
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
