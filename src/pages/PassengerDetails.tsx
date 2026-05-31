import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { BookingData, Passenger, BERTH_LABELS, BerthType } from "@/types/booking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, ShieldCheck, ChevronRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const PassengerDetails = () => {
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [contactInfo, setContactInfo] = useState({ mobile: "", email: "" });

  useEffect(() => {
    const data = sessionStorage.getItem("bookingData");
    if (data) {
      const parsed: BookingData = JSON.parse(data);
      setBookingData(parsed);

      const initialPassengers: Passenger[] = parsed.seats.map((seatNum) => ({
        name: "",
        age: "",
        gender: "male",
        mobile: "",
        email: "",
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
  };

  const handleContinue = () => {
    const isAnyEmpty = passengers.some(p => !p.name || !p.age);
    if (isAnyEmpty || !contactInfo.mobile || !contactInfo.email) {
      toast.error("Please fill all passenger and contact details");
      return;
    }

    const updatedData = { 
      ...bookingData!, 
      passengers: passengers.map(p => ({ ...p, mobile: contactInfo.mobile, email: contactInfo.email })) 
    };
    sessionStorage.setItem("bookingData", JSON.stringify(updatedData));
    navigate("/review");
  };

  if (!bookingData) return null;

  return (
    <div className="min-h-screen bg-[#f4f7f4]">
      <div className="bg-[#006633] text-white">
        <Header />
        <div className="max-w-4xl mx-auto px-5 py-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm opacity-80 mb-4 hover:opacity-100">
            <ArrowLeft className="w-4 h-4" />
            Back to Seat Selection
          </button>
          <h1 className="text-2xl font-bold">Passenger Details</h1>
          <p className="text-sm opacity-80">Coach {bookingData.coachId} | {bookingData.seats.length} Seats Selected</p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-5 py-8">
        <div className="space-y-6">
          {passengers.map((passenger, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-green-100 text-[#006633] flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <h3 className="font-bold text-gray-800">Passenger {index + 1} (Seat {passenger.seatNumber})</h3>
                <Badge variant="outline" className="text-[10px] uppercase">{BERTH_LABELS[passenger.berthType as BerthType]}</Badge>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <Label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Full Name</Label>
                  <Input
                    value={passenger.name}
                    onChange={(e) => updatePassenger(index, "name", e.target.value)}
                    placeholder="Enter Name"
                    className="rounded-lg border-gray-200"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Age</Label>
                  <Input
                    type="number"
                    value={passenger.age}
                    onChange={(e) => updatePassenger(index, "age", e.target.value)}
                    placeholder="Age"
                    className="rounded-lg border-gray-200"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Gender</Label>
                  <Select 
                    value={passenger.gender} 
                    onValueChange={(val) => updatePassenger(index, "gender", val)}
                  >
                    <SelectTrigger className="rounded-lg border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-6">Contact Information</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Mobile Number</Label>
                <Input
                  type="tel"
                  value={contactInfo.mobile}
                  onChange={(e) => setContactInfo({ ...contactInfo, mobile: e.target.value })}
                  placeholder="10-digit mobile number"
                  className="rounded-lg border-gray-200"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Email Address</Label>
                <Input
                  type="email"
                  value={contactInfo.email}
                  onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                  placeholder="Email for ticket delivery"
                  className="rounded-lg border-gray-200"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div>
              <div className="text-xs text-gray-500 uppercase font-bold">Total Amount</div>
              <div className="text-2xl font-black text-[#006633]">₹{bookingData.totalFare}</div>
            </div>
            <Button 
              onClick={handleContinue}
              className="bg-[#006633] hover:bg-[#004d26] text-white font-black px-10 py-6 rounded-xl shadow-lg shadow-green-900/20"
            >
              REVIEW BOOKING
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PassengerDetails;