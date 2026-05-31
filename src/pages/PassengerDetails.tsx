import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { BookingData, Passenger, BERTH_LABELS, BerthType } from "@/types/booking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Info, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";

const PassengerDetails = () => {
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [errors, setErrors] = useState<Record<number, { name?: string; age?: string }>>({});

  useEffect(() => {
    const data = sessionStorage.getItem("bookingData");
    if (data) {
      const parsed: BookingData = JSON.parse(data);
      setBookingData(parsed);

      const initialPassengers: Passenger[] = parsed.seats.map((seatNum) => ({
        name: "",
        age: "",
        seatNumber: seatNum,
        berthType: parsed.seatTypes[seatNum] || "lb",
        preference: parsed.seatTypes[seatNum] as BerthType,
      }));
      setPassengers(initialPassengers);
    } else {
      navigate("/");
    }
  }, [navigate]);

  const updatePassenger = (index: number, field: keyof Passenger, value: any) => {
    setPassengers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
    if (field === 'age') {
      const age = parseInt(value);
      if (age > 60) {
        toast.info(`Senior citizen detected. We'll prioritize Lower Berth for ${passengers[index].name || 'this passenger'}.`, {
          icon: <Sparkles className="w-4 h-4 text-primary" />
        });
      }
    }
    setErrors((prev) => ({
      ...prev,
      [index]: { ...prev[index], [field]: undefined },
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<number, { name?: string; age?: string }> = {};
    let isValid = true;

    passengers.forEach((p, i) => {
      const errs: { name?: string; age?: string } = {};
      if (!p.name.trim()) { errs.name = "Name is required"; isValid = false; }
      if (!p.age.trim()) { errs.age = "Age is required"; isValid = false; }
      else {
        const ageNum = parseInt(p.age, 10);
        if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) { errs.age = "Invalid age"; isValid = false; }
      }
      if (Object.keys(errs).length > 0) newErrors[i] = errs;
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleContinue = () => {
    if (!validate()) return;
    const updatedData = { ...bookingData, passengers };
    sessionStorage.setItem("bookingData", JSON.stringify(updatedData));
    navigate("/booking");
  };

  if (!bookingData) return null;

  return (
    <div className="min-h-screen gradient-bg">
      <Header />

      <div className="max-w-4xl mx-auto px-5 py-8">
        <div className="glass-card p-8 animate-panel-in">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-black text-primary">Passenger Details</h2>
              <p className="text-muted-foreground mt-1">Smart grouping enabled for your selection</p>
            </div>
            <Badge className="bg-primary/20 text-primary border-primary/30 px-4 py-2">
              <Users className="w-4 h-4 mr-2" />
              {passengers.length} Passengers
            </Badge>
          </div>

          {/* Smart Grouping Info */}
          <div className="mb-8 p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary shrink-0 mt-1" />
            <div>
              <p className="text-sm font-bold text-primary">Family Grouping AI Active</p>
              <p className="text-xs text-muted-foreground">We've automatically clustered your seats in Coach {bookingData.coach} to ensure you stay together.</p>
            </div>
          </div>

          <div className="space-y-6">
            {passengers.map((passenger, index) => (
              <div key={passenger.seatNumber} className="p-6 rounded-2xl border border-border bg-card/30 hover:border-primary/30 transition-colors group">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl seat-${passenger.berthType} border-2 border-black flex items-center justify-center font-black text-xl text-gray-900 shadow-lg group-hover:scale-110 transition-transform`}>
                      {passenger.seatNumber}
                    </div>
                    <div>
                      <p className="font-black text-lg">Passenger {index + 1}</p>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        {BERTH_LABELS[passenger.berthType as BerthType]}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <Label className="text-xs font-black uppercase tracking-wider mb-2 block opacity-70">Full Name</Label>
                    <Input
                      value={passenger.name}
                      onChange={(e) => updatePassenger(index, "name", e.target.value)}
                      placeholder="As per ID proof"
                      className="rounded-xl py-6 bg-background/50 border-border focus:border-primary"
                    />
                    {errors[index]?.name && <p className="text-destructive text-[10px] font-bold mt-1 uppercase">{errors[index].name}</p>}
                  </div>

                  <div>
                    <Label className="text-xs font-black uppercase tracking-wider mb-2 block opacity-70">Age</Label>
                    <Input
                      type="number"
                      value={passenger.age}
                      onChange={(e) => updatePassenger(index, "age", e.target.value)}
                      placeholder="Age"
                      className="rounded-xl py-6 bg-background/50 border-border focus:border-primary"
                    />
                    {errors[index]?.age && <p className="text-destructive text-[10px] font-bold mt-1 uppercase">{errors[index].age}</p>}
                  </div>

                  <div>
                    <Label className="text-xs font-black uppercase tracking-wider mb-2 block opacity-70">Berth Preference</Label>
                    <Select 
                      value={passenger.preference} 
                      onValueChange={(val) => updatePassenger(index, "preference", val)}
                    >
                      <SelectTrigger className="rounded-xl py-6 bg-background/50 border-border">
                        <SelectValue placeholder="Select Preference" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(BERTH_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 p-6 rounded-2xl bg-gradient-to-br from-background to-primary/5 border border-border">
            <div className="flex justify-between items-center text-2xl font-black">
              <span className="text-muted-foreground text-lg">Total Payable</span>
              <span className="text-primary">₹{bookingData.totalFare}</span>
            </div>
          </div>

          <Button
            onClick={handleContinue}
            className="w-full mt-8 py-8 text-xl font-black rounded-2xl btn-primary-gradient shadow-xl shadow-primary/20 hover:scale-[1.01] transition-transform"
          >
            Review Booking
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PassengerDetails;