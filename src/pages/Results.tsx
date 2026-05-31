import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import { Train, FARES } from "@/types/booking";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  ArrowRight, 
  Star, 
  Utensils, 
  ShieldCheck, 
  ChevronRight, 
  Search,
  Calendar,
  MapPin
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const Results = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const date = searchParams.get("date") || "";

  const [trains, setTrains] = useState<Train[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Mocking train data with ConfirmTkt style metadata
    setTimeout(() => {
      const mockTrains: Train[] = [
        {
          number: "12734",
          name: "Narayanadri Express",
          dep: "23:45",
          arr: "03:10",
          duration: "3h 25m",
          fromStation: from,
          toStation: to,
          coaches: ["SL", "3A", "2A", "1A"],
          crowdLevel: 'medium',
          confirmationProb: 85,
          rating: 4.2,
          onTime: "92%",
          meals: true,
          platform: "5",
          availability: {
            SL: { status: "Available", count: 145, color: 'green' },
            "3A": { status: "WL", count: 3, color: 'red' },
            "2A": { status: "Available", count: 12, color: 'green' },
            "1A": { status: "Available", count: 4, color: 'green' }
          }
        },
        {
          number: "12864",
          name: "HWH YPR Express",
          dep: "10:30",
          arr: "14:15",
          duration: "3h 45m",
          fromStation: from,
          toStation: to,
          coaches: ["SL", "3A", "2A"],
          crowdLevel: 'low',
          confirmationProb: 95,
          rating: 4.5,
          onTime: "98%",
          meals: false,
          platform: "2",
          availability: {
            SL: { status: "Available", count: 82, color: 'green' },
            "3A": { status: "RAC", count: 5, color: 'orange' },
            "2A": { status: "Available", count: 8, color: 'green' }
          }
        }
      ];
      setTrains(mockTrains);
      setLoading(false);
    }, 1000);
  }, [from, to]);

  const handleBook = (train: Train, coachType: string) => {
    const bookingData = {
      train,
      from,
      to,
      date,
      coachType,
      fare: FARES[coachType],
      seats: [],
      seatTypes: {},
      totalFare: 0
    };
    sessionStorage.setItem("bookingData", JSON.stringify(bookingData));
    navigate(`/train-details?train=${train.number}&coach=${coachType}`);
  };

  return (
    <div className="min-h-screen bg-[#f4f7f4]">
      <div className="bg-[#006633] text-white sticky top-0 z-50 shadow-lg">
        <Header />
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-lg font-bold">
                <span>{from}</span>
                <ArrowRight className="w-4 h-4" />
                <span>{to}</span>
              </div>
              <div className="flex items-center gap-2 text-xs opacity-80">
                <Calendar className="w-3 h-3" />
                <span>{new Date(date).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            onClick={() => navigate("/")}
          >
            <Search className="w-4 h-4 mr-2" />
            Modify Search
          </Button>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-5 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Found {trains.length} trains</h2>
          <div className="flex gap-2">
            <Badge variant="secondary" className="bg-white border-gray-200">Fastest</Badge>
            <Badge variant="secondary" className="bg-white border-gray-200">Earliest</Badge>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-white rounded-xl animate-pulse shadow-sm" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {trains.map((train) => (
              <div key={train.number} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#006633]">{train.number}</span>
                        <h3 className="text-lg font-bold text-gray-900">{train.name}</h3>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <span>{train.rating}</span>
                        </div>
                        <div className="text-xs text-gray-500">On-time: <span className="text-green-600 font-bold">{train.onTime}</span></div>
                        {train.meals && <Utensils className="w-3 h-3 text-gray-400" />}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Platform</div>
                      <div className="text-lg font-bold text-gray-900">{train.platform || "TBA"}</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-8">
                    <div className="text-center">
                      <div className="text-2xl font-black text-gray-900">{train.dep}</div>
                      <div className="text-xs font-bold text-gray-500 uppercase">{from}</div>
                    </div>
                    <div className="flex-1 px-10 flex flex-col items-center">
                      <div className="text-xs text-gray-400 mb-1">{train.duration}</div>
                      <div className="w-full h-[2px] bg-gray-100 relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#006633]" />
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-black text-gray-900">{train.arr}</div>
                      <div className="text-xs font-bold text-gray-500 uppercase">{to}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(train.availability).map(([coach, data]) => (
                      <button
                        key={coach}
                        onClick={() => handleBook(train, coach)}
                        className={`p-3 rounded-lg border text-left transition-all hover:scale-[1.02] ${
                          data.color === 'green' ? 'bg-green-50 border-green-100' :
                          data.color === 'orange' ? 'bg-orange-50 border-orange-100' :
                          'bg-red-50 border-red-100'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-gray-800">{coach}</span>
                          <span className="text-xs font-bold text-gray-900">₹{FARES[coach]}</span>
                        </div>
                        <div className={`text-xs font-black ${
                          data.color === 'green' ? 'text-green-600' :
                          data.color === 'orange' ? 'text-orange-600' :
                          'text-red-600'
                        }`}>
                          {data.status} {data.count}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">
                          {train.confirmationProb}% Confirmation
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="bg-gray-50 px-5 py-3 flex justify-between items-center border-t border-gray-100">
                  <div className="flex gap-4">
                    <button className="text-xs font-bold text-[#006633] hover:underline">Running Status</button>
                    <button className="text-xs font-bold text-[#006633] hover:underline">Coach Position</button>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-[#006633] hover:bg-[#004d26] text-white font-bold rounded-full px-6"
                    onClick={() => handleBook(train, "SL")}
                  >
                    BOOK NOW
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Results;