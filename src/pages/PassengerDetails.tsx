import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { BookingData, Passenger, BERTH_LABELS, BerthType } from "@/types/booking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

      // Initialize passengers for each seat
      const initialPassengers: Passenger[] = parsed.seats.map((seatNum) => ({
        name: "",
        age: "",
        seatNumber: seatNum,
        berthType: parsed.seatTypes[seatNum] || "lb",
      }));
      setPassengers(initialPassengers);
    } else {
      navigate("/");
    }
  }, [navigate]);

  const updatePassenger = (index: number, field: "name" | "age", value: string) => {
    setPassengers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
    // Clear error for this field
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
      if (!p.name.trim()) {
        errs.name = "Name is required";
        isValid = false;
      } else if (p.name.trim().length < 2) {
        errs.name = "Name must be at least 2 characters";
        isValid = false;
      }
      if (!p.age.trim()) {
        errs.age = "Age is required";
        isValid = false;
      } else {
        const ageNum = parseInt(p.age, 10);
        if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
          errs.age = "Enter a valid age (1-120)";
          isValid = false;
        }
      }
      if (Object.keys(errs).length > 0) {
        newErrors[i] = errs;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleContinue = () => {
    if (!validate()) return;

    const updatedData = {
      ...bookingData,
      passengers,
    };
    sessionStorage.setItem("bookingData", JSON.stringify(updatedData));
    navigate("/booking");
  };

  if (!bookingData) return null;

  return (
    <div className="min-h-screen gradient-bg">
      <Header />

      <div className="max-w-3xl mx-auto px-5 py-8">
        <div className="glass-card p-8">
          <h2 className="text-2xl font-extrabold text-primary mb-2">
            Passenger Details
          </h2>
          <p className="text-muted-foreground mb-8">
            Please enter details for each passenger
          </p>

          {/* Train Info */}
          <div className="mb-8 p-4 rounded-xl bg-card/50 border border-border">
            <p className="font-semibold">
              {bookingData.train.number} - {bookingData.train.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {bookingData.from} → {bookingData.to} | Coach: {bookingData.coach}
            </p>
          </div>

          {/* Passenger Forms */}
          <div className="space-y-6">
            {passengers.map((passenger, index) => (
              <div
                key={passenger.seatNumber}
                className="p-5 rounded-xl border border-border bg-card/30"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg seat-${passenger.berthType} border-2 border-black flex items-center justify-center font-bold text-gray-900`}>
                    {passenger.seatNumber}
                  </div>
                  <div>
                    <p className="font-semibold">Seat {passenger.seatNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {BERTH_LABELS[passenger.berthType as BerthType]}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`name-${index}`} className="mb-2 block">
                      Full Name
                    </Label>
                    <Input
                      id={`name-${index}`}
                      value={passenger.name}
                      onChange={(e) => updatePassenger(index, "name", e.target.value)}
                      placeholder="Enter passenger name"
                      className={`rounded-xl py-5 ${errors[index]?.name ? "border-destructive" : ""}`}
                    />
                    {errors[index]?.name && (
                      <p className="text-destructive text-sm mt-1">{errors[index].name}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`age-${index}`} className="mb-2 block">
                      Age
                    </Label>
                    <Input
                      id={`age-${index}`}
                      type="number"
                      min="1"
                      max="120"
                      value={passenger.age}
                      onChange={(e) => updatePassenger(index, "age", e.target.value)}
                      placeholder="Enter age"
                      className={`rounded-xl py-5 ${errors[index]?.age ? "border-destructive" : ""}`}
                    />
                    {errors[index]?.age && (
                      <p className="text-destructive text-sm mt-1">{errors[index].age}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-8 p-5 rounded-xl bg-gradient-to-br from-background to-primary/10 border border-border">
            <div className="flex justify-between items-center mb-4">
              <span className="text-muted-foreground">Fare per seat</span>
              <span>₹{bookingData.fare}</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-muted-foreground">Number of passengers</span>
              <span>{passengers.length}</span>
            </div>
            <div className="flex justify-between items-center text-xl font-bold">
              <span>Total Amount</span>
              <span className="text-primary">₹{bookingData.totalFare}</span>
            </div>
          </div>

          <Button
            onClick={handleContinue}
            className="w-full mt-6 py-6 text-lg font-bold rounded-2xl btn-primary-gradient"
          >
            Continue to Booking Summary
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PassengerDetails;
