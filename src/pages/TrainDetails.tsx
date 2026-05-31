import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import { BookingData, CoachData, COACH_NAMES } from "@/types/booking";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, MapPin, Info, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TrainDetails = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const trainNum = searchParams.get("train");
  const initialCoach = searchParams.get("coach") || "SL";

  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [coaches, setCoaches] = useState<CoachData[]>([]);

  useEffect(() => {
    const data = sessionStorage.getItem("bookingData");
    if (data) {
      const parsed = JSON.parse(data);
      setBookingData(parsed);

      // Generate mock coaches based on class
      const mockCoaches: CoachData[] = [];
      const classes = ["SL", "3A", "2A", "1A"];
      
      classes.forEach(cls => {
        const prefix = cls === 'SL' ? 'S' : cls === '3A' ? 'B' : cls === '2A' ? 'A' : 'H';
        const count = cls === 'SL' ? 8 : cls === '3A' ? 3 : 2;
        
        for (let i = 1; i <= count; i++) {
          mockCoaches.push({
            id: `${prefix}${i}`,
            type: COACH_NAMES[cls],
            classType: cls,
            occupancy: Math.floor(Math.random() * 40) + 60,
            availableSeats: Math.floor(Math.random() * 50) + 5,
            totalSeats: cls === 'SL' ? 72 : 64
          });
        }
      });
      setCoaches(mockCoaches);
    } else {
      navigate("/");
    }
  }, [navigate]);

  const handleCoachSelect = (coach: CoachData) => {
    const updatedData = {
      ...bookingData!,
      coachId: coach.id,
      coachType: coach.classType,
    };
    sessionStorage.setItem("bookingData", JSON.stringify(updatedData));
    navigate(`/seats/${coach.classType.toLowerCase()}`);
  };

  if (!bookingData) return null;

  return (
    <div className="min-h-screen bg-[#f4f7f4]">
      <div className="bg-[#006633] text-white">
        <Header />
        <div className="max-w-5xl mx-auto px-5 py-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm opacity-80 mb-4 hover:opacity-100">
            <ArrowLeft className="w-4 h-4" />
            Back to Results
          </button>
          <div className="flex justify-between items-end">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-2xl font-black">{bookingData.train.number}</span>
                <h1 className="text-2xl font-bold">{bookingData.train.name}</h1>
              </div>
              <div className="flex items-center gap-4 text-sm opacity-80">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {bookingData.from} → {bookingData.to}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {bookingData.train.duration}</span>
              </div>
            </div>
            <Badge className="bg-white/20 text-white border-none px-4 py-2">
              {new Date(bookingData.date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })}
            </Badge>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-5 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Select Coach</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {coaches.map((coach) => (
                  <button
                    key={coach.id}
                    onClick={() => handleCoachSelect(coach)}
                    className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:border-[#006633] hover:shadow-md transition-all text-left group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-2xl font-black text-gray-900 group-hover:text-[#006633]">{coach.id}</span>
                      <Badge variant="outline" className="text-[10px] font-bold uppercase">{coach.classType}</Badge>
                    </div>
                    <div className="text-sm text-gray-500 mb-2">{coach.type}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-green-600">{coach.availableSeats} Available</span>
                      <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: `${(coach.availableSeats/coach.totalSeats)*100}%` }} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Info className="w-4 h-4 text-[#006633]" />
                Important Information
              </h3>
              <div className="space-y-4 text-sm text-gray-600">
                <div className="flex gap-3">
                  <div className="w-1 h-1 rounded-full bg-gray-400 mt-2 shrink-0" />
                  <p>Cancellation Policy: Full refund if cancelled 48hrs before departure.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-1 h-1 rounded-full bg-gray-400 mt-2 shrink-0" />
                  <p>Platform Prediction: This train usually arrives at Platform {bookingData.train.platform}.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-1 h-1 rounded-full bg-gray-400 mt-2 shrink-0" />
                  <p>Meal Availability: Pantry car available. E-catering can be booked.</p>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm sticky top-32">
              <h3 className="font-bold text-gray-800 mb-4">Fare Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Base Fare</span>
                  <span className="font-bold">₹{bookingData.fare}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax & Fees</span>
                  <span className="font-bold">₹45</span>
                </div>
                <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="font-bold text-gray-800">Total Amount</span>
                  <span className="text-xl font-black text-[#006633]">₹{bookingData.fare + 45}</span>
                </div>
              </div>
              <div className="mt-6 p-3 bg-green-50 rounded-lg flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                <span className="text-[10px] font-bold text-green-700 uppercase">Secure Booking Guaranteed</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TrainDetails;