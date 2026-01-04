import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { BookingData, COACH_NAMES, BERTH_LABELS, BerthType } from "@/types/booking";
import { Button } from "@/components/ui/button";

const Booking = () => {
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);

  useEffect(() => {
    const data = sessionStorage.getItem("bookingData");
    if (data) {
      setBookingData(JSON.parse(data));
    } else {
      navigate("/");
    }
  }, [navigate]);

  const handleProceedToPayment = () => {
    navigate("/payment");
  };

  if (!bookingData) return null;

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-5">
      <div className="glass-card p-8 max-w-lg w-full">
        <h2 className="text-2xl font-extrabold text-center text-primary mb-6">
          Booking Summary
        </h2>

        {/* Train Details */}
        <div className="p-4 rounded-xl bg-card/50 border border-border mb-6">
          <p className="text-lg font-bold">
            {bookingData.train.number} - {bookingData.train.name}
          </p>
          <p className="text-muted-foreground text-sm">
            {bookingData.from} → {bookingData.to}
          </p>
          <p className="text-muted-foreground text-sm">
            Date: {new Date(bookingData.date).toLocaleDateString("en-IN", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Passenger List */}
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Passengers</h3>
          <div className="space-y-2">
            {bookingData.passengers?.map((p, i) => (
              <div
                key={i}
                className="flex justify-between items-center p-3 rounded-lg bg-card/30 border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded seat-${p.berthType} border border-black flex items-center justify-center text-sm font-bold text-gray-900`}>
                    {p.seatNumber}
                  </div>
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Age: {p.age} | {BERTH_LABELS[p.berthType as BerthType]}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fare Breakdown */}
        <div className="space-y-3 py-4 border-t border-border">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Coach</span>
            <span>{bookingData.coach} ({COACH_NAMES[bookingData.coach]})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Seats</span>
            <span>{bookingData.seats.join(", ")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fare per Seat</span>
            <span>₹{bookingData.fare}</span>
          </div>
        </div>

        <div className="flex justify-between items-center py-4 border-t border-border text-xl font-bold">
          <span>Total Amount</span>
          <span className="text-primary">₹{bookingData.totalFare}</span>
        </div>

        <Button
          onClick={handleProceedToPayment}
          className="w-full mt-4 py-6 text-lg font-bold rounded-2xl btn-primary-gradient"
        >
          Proceed to Payment
        </Button>
      </div>
    </div>
  );
};

export default Booking;
