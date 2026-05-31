import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { BookingData, COACH_NAMES, BERTH_LABELS, BerthType } from "@/types/booking";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldCheck, ChevronRight, Train, MapPin, Calendar, Users } from "lucide-react";

const Review = () => {
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

  if (!bookingData) return null;

  return (
    <div className="min-h-screen bg-[#f4f7f4]">
      <div className="bg-[#006633] text-white">
        <Header />
        <div className="max-w-4xl mx-auto px-5 py-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm opacity-80 mb-4 hover:opacity-100">
            <ArrowLeft className="w-4 h-4" />
            Back to Details
          </button>
          <h1 className="text-2xl font-bold">Review Your Booking</h1>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-5 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Train Summary */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <Train className="w-5 h-5 text-[#006633]" />
                <h3 className="font-bold text-gray-800">Train Details</h3>
              </div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="text-lg font-black text-gray-900">{bookingData.train.number} - {bookingData.train.name}</div>
                  <div className="text-sm text-gray-500">{COACH_NAMES[bookingData.coachType]} | Coach {bookingData.coachId}</div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm font-bold text-gray-800">
                    <Calendar className="w-3 h-3" />
                    {new Date(bookingData.date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-xl font-black">{bookingData.train.dep}</div>
                  <div className="text-xs font-bold text-gray-500">{bookingData.from}</div>
                </div>
                <div className="text-gray-300">→</div>
                <div className="text-center">
                  <div className="text-xl font-black">{bookingData.train.arr}</div>
                  <div className="text-xs font-bold text-gray-500">{bookingData.to}</div>
                </div>
              </div>
            </div>

            {/* Passenger Summary */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-5 h-5 text-[#006633]" />
                <h3 className="font-bold text-gray-800">Passenger List</h3>
              </div>
              <div className="space-y-4">
                {bookingData.passengers?.map((p, i) => (
                  <div key={i} className="flex justify-between items-center p-4 border border-gray-50 rounded-lg">
                    <div>
                      <div className="font-bold text-gray-800">{p.name}</div>
                      <div className="text-xs text-gray-500">{p.age} yrs | {p.gender}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-[#006633]">Seat {p.seatNumber}</div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase">{BERTH_LABELS[p.berthType as BerthType]}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-32">
              <h3 className="font-bold text-gray-800 mb-6">Fare Breakup</h3>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Ticket Fare</span>
                  <span className="font-bold">₹{bookingData.fare * (bookingData.passengers?.length || 1)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">GST (5%)</span>
                  <span className="font-bold">₹{bookingData.gst}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Service Fee</span>
                  <span className="font-bold">₹0</span>
                </div>
                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="font-bold text-gray-800">Total Amount</span>
                  <span className="text-2xl font-black text-[#006633]">₹{bookingData.totalFare}</span>
                </div>
              </div>

              <Button 
                onClick={() => navigate("/payment")}
                className="w-full py-7 bg-[#006633] hover:bg-[#004d26] text-white font-black text-lg rounded-xl shadow-lg shadow-green-900/20"
              >
                PROCEED TO PAY
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex gap-3">
                  <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                  <p className="text-[10px] text-blue-700 leading-relaxed">
                    By clicking proceed, you agree to our cancellation and refund policies. Your payment is secured with 256-bit encryption.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Review;