import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { BookingData, COACH_NAMES } from "@/types/booking";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Lock, CreditCard, Smartphone, Building2, Wallet, Check } from "lucide-react";

type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet' | null;

const Payment = () => {
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
  const [selectedUpi, setSelectedUpi] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const data = sessionStorage.getItem("bookingData");
    if (data) {
      setBookingData(JSON.parse(data));
    } else {
      navigate("/");
    }
  }, [navigate]);

  const handlePayment = () => {
    if (!selectedMethod) {
      alert("Please select a payment method");
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      // Generate PNR
      const pnr = Math.random().toString(36).substring(2, 12).toUpperCase();
      sessionStorage.setItem("pnrNumber", pnr);
      navigate("/ticket");
    }, 1500);
  };

  const paymentMethods = [
    { id: 'upi' as const, label: 'UPI', icon: Smartphone, options: ["Google Pay", "PhonePe", "Paytm", "Amazon Pay"] },
    { id: 'card' as const, label: 'Credit / Debit Card', icon: CreditCard },
    { id: 'netbanking' as const, label: 'Net Banking', icon: Building2 },
    { id: 'wallet' as const, label: 'Wallet', icon: Wallet },
  ];

  if (!bookingData) return null;

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-5">
      <div className="glass-card p-8 max-w-md w-full animate-fade-in">
        <h2 className="text-2xl font-extrabold text-center text-primary mb-6">
          Ticket Summary
        </h2>

        {/* Ticket Details */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between animate-slide-in-right" style={{ animationDelay: '100ms' }}>
            <span className="text-muted-foreground">Train</span>
            <span className="font-semibold text-right">
              {bookingData.train.number} - {bookingData.train.name}
            </span>
          </div>
          <div className="flex justify-between animate-slide-in-right" style={{ animationDelay: '150ms' }}>
            <span className="text-muted-foreground">Route</span>
            <span>{bookingData.from} → {bookingData.to}</span>
          </div>
          <div className="flex justify-between animate-slide-in-right" style={{ animationDelay: '200ms' }}>
            <span className="text-muted-foreground">Date</span>
            <span>
              {new Date(bookingData.date).toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex justify-between animate-slide-in-right" style={{ animationDelay: '250ms' }}>
            <span className="text-muted-foreground">Coach</span>
            <span>{bookingData.coach} ({COACH_NAMES[bookingData.coach]})</span>
          </div>
          <div className="flex justify-between animate-slide-in-right" style={{ animationDelay: '300ms' }}>
            <span className="text-muted-foreground">Seats</span>
            <span>{bookingData.seats.join(", ")}</span>
          </div>
          <div className="flex justify-between animate-slide-in-right" style={{ animationDelay: '350ms' }}>
            <span className="text-muted-foreground">Passengers</span>
            <span>{bookingData.passengers?.length || bookingData.seats.length}</span>
          </div>
          <div className="flex justify-between animate-slide-in-right" style={{ animationDelay: '400ms' }}>
            <span className="text-muted-foreground">Fare per Seat</span>
            <span>₹{bookingData.fare}</span>
          </div>
        </div>

        <div className="border-t border-border py-4 mb-6">
          <div className="flex justify-between text-xl font-bold">
            <span>Total Payable</span>
            <span className="text-primary animate-pulse">₹{bookingData.totalFare}</span>
          </div>
        </div>

        {/* Payment Options */}
        <div className="mb-6">
          <h3 className="font-semibold mb-4">Select Payment Method</h3>

          {paymentMethods.map((method, index) => (
            <div key={method.id} className="mb-3 animate-fade-in" style={{ animationDelay: `${(index + 1) * 100}ms` }}>
              <button
                onClick={() => {
                  setSelectedMethod(method.id);
                  if (method.id !== 'upi') setSelectedUpi(null);
                }}
                className={`w-full flex justify-between items-center p-4 rounded-xl border transition-all duration-300 ${
                  selectedMethod === method.id
                    ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                    : 'border-border bg-card/50 hover:bg-primary/5 hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <method.icon className={`w-5 h-5 ${selectedMethod === method.id ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`font-medium ${selectedMethod === method.id ? 'text-primary' : ''}`}>
                    {method.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedMethod === method.id && (
                    <Check className="w-5 h-5 text-primary animate-scale-in" />
                  )}
                  {method.options ? (
                    selectedMethod === method.id ? (
                      <ChevronDown className="w-5 h-5 transition-transform" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )
                  ) : null}
                </div>
              </button>
              
              {/* UPI Options */}
              {method.options && selectedMethod === method.id && (
                <div className="mt-2 rounded-xl border border-border bg-card/50 overflow-hidden animate-accordion-down">
                  {method.options.map((app) => (
                    <button
                      key={app}
                      onClick={() => setSelectedUpi(app)}
                      className={`w-full text-left px-4 py-3 border-b border-border last:border-b-0 transition-all duration-200 flex items-center justify-between ${
                        selectedUpi === app ? 'bg-primary/10 text-primary' : 'hover:bg-primary/5'
                      }`}
                    >
                      <span>{app}</span>
                      {selectedUpi === app && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <Button
          onClick={handlePayment}
          disabled={isProcessing || !selectedMethod}
          className={`w-full py-6 text-lg font-bold rounded-2xl transition-all duration-300 ${
            selectedMethod 
              ? 'btn-primary-gradient hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25' 
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            `Pay ₹${bookingData.totalFare}`
          )}
        </Button>

        <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground animate-fade-in">
          <Lock className="w-4 h-4" />
          100% Safe Payment Process
        </div>
      </div>
    </div>
  );
};

export default Payment;
