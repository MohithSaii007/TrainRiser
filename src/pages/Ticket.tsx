import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BookingData, COACH_NAMES, BERTH_LABELS, BerthType } from "@/types/booking";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle, FileText, Mail } from "lucide-react";
import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const Ticket = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [pnr, setPnr] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const data = sessionStorage.getItem("bookingData");
    const pnrNumber = sessionStorage.getItem("pnrNumber");
    
    if (data && pnrNumber) {
      setBookingData(JSON.parse(data));
      setPnr(pnrNumber);
      
      // Auto-send confirmation email if user is logged in
      const booking = JSON.parse(data);
      if (user?.email && !emailSent) {
        sendConfirmationEmail(booking, pnrNumber, user.email);
      }
    } else {
      navigate("/");
    }
  }, [navigate, user, emailSent]);

  const sendConfirmationEmail = async (booking: BookingData, pnrNumber: string, email: string) => {
    setSendingEmail(true);
    try {
      const { error } = await supabase.functions.invoke("send-ticket-confirmation", {
        body: {
          email,
          pnr: pnrNumber,
          trainNumber: booking.train.number,
          trainName: booking.train.name,
          from: booking.from,
          to: booking.to,
          date: booking.date,
          coach: booking.coach,
          passengers: booking.passengers,
          totalFare: booking.totalFare,
        },
      });

      if (error) throw error;
      
      setEmailSent(true);
      toast.success("Confirmation email sent!");
    } catch (error: any) {
      console.error("Error sending confirmation email:", error);
      // Don't show error to user, just log it
    } finally {
      setSendingEmail(false);
    }
  };

  const downloadPDF = () => {
    if (!bookingData) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // Header background
    pdf.setFillColor(16, 185, 129); // Emerald color
    pdf.rect(0, 0, pageWidth, 45, 'F');
    
    // Title
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont("helvetica", "bold");
    pdf.text("TrainRiser", 20, 25);
    
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text("E-Ticket", 20, 35);
    
    // PNR
    pdf.setFontSize(10);
    pdf.text("PNR Number", pageWidth - 60, 20);
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text(pnr, pageWidth - 60, 32);
    
    // Reset text color
    pdf.setTextColor(0, 0, 0);
    
    // Train Details Section
    let yPos = 60;
    
    pdf.setFillColor(240, 253, 244); // Light emerald background
    pdf.rect(15, yPos - 5, pageWidth - 30, 50, 'F');
    
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(16, 185, 129);
    pdf.text(bookingData.train.number, 20, yPos + 10);
    
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.text(bookingData.train.name, 20, yPos + 20);
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.text(`Class: ${bookingData.coach} (${COACH_NAMES[bookingData.coach]})`, pageWidth - 80, yPos + 10);
    
    // Route
    yPos += 35;
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text(bookingData.from, 20, yPos);
    pdf.text("→", pageWidth / 2 - 5, yPos);
    pdf.text(bookingData.to, pageWidth - 60, yPos);
    
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(16, 185, 129);
    pdf.text(bookingData.train.dep, 20, yPos + 8);
    pdf.text(bookingData.train.arr, pageWidth - 60, yPos + 8);
    
    // Journey Date
    yPos += 25;
    pdf.setTextColor(100, 100, 100);
    pdf.text("Journey Date:", 20, yPos);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "bold");
    pdf.text(new Date(bookingData.date).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }), 55, yPos);
    
    // Passengers Section
    yPos += 20;
    pdf.setFillColor(249, 250, 251);
    pdf.rect(15, yPos - 5, pageWidth - 30, 10 + (bookingData.passengers?.length || 0) * 15, 'F');
    
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(55, 65, 81);
    pdf.text("Passenger Details", 20, yPos + 5);
    
    yPos += 15;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    
    bookingData.passengers?.forEach((p, i) => {
      pdf.setTextColor(0, 0, 0);
      pdf.text(`${i + 1}. ${p.name}`, 25, yPos);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Age: ${p.age}`, 90, yPos);
      pdf.setTextColor(16, 185, 129);
      pdf.setFont("helvetica", "bold");
      pdf.text(`Seat ${p.seatNumber}`, 120, yPos);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100, 100, 100);
      pdf.text(BERTH_LABELS[p.berthType as BerthType], 150, yPos);
      yPos += 12;
    });
    
    // Fare Section
    yPos += 15;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(20, yPos, pageWidth - 20, yPos);
    
    yPos += 15;
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(11);
    pdf.text("Total Fare", 20, yPos);
    pdf.setTextColor(16, 185, 129);
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text(`₹${bookingData.totalFare}`, pageWidth - 50, yPos);
    
    // Confirmation Badge
    yPos += 20;
    pdf.setFillColor(220, 252, 231);
    pdf.roundedRect(15, yPos - 5, pageWidth - 30, 20, 3, 3, 'F');
    pdf.setTextColor(21, 128, 61);
    pdf.setFontSize(12);
    pdf.text("✓ Booking Confirmed", pageWidth / 2 - 25, yPos + 8);
    
    // Footer
    yPos += 35;
    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text("Thank you for booking with TrainRiser! Have a safe journey.", pageWidth / 2, yPos, { align: 'center' });
    
    pdf.save(`TrainRiser_Ticket_${pnr}.pdf`);
  };

  if (!bookingData) return null;

  return (
    <div className="min-h-screen gradient-bg p-5 flex flex-col items-center justify-center">
      {/* Success Message */}
      <div className="flex items-center gap-3 mb-6 text-primary animate-bounce">
        <CheckCircle className="w-10 h-10" />
        <span className="text-2xl font-bold">Payment Successful!</span>
      </div>

      {/* Ticket */}
      <div
        ref={ticketRef}
        className="bg-white text-gray-900 rounded-2xl overflow-hidden shadow-2xl max-w-lg w-full animate-scale-in"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black">TrainRiser</h1>
              <p className="text-emerald-100 text-sm mt-1">E-Ticket</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-emerald-100">PNR Number</p>
              <p className="text-xl font-mono font-bold">{pnr}</p>
            </div>
          </div>
        </div>

        {/* Train Info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-2xl font-bold text-emerald-600">
                {bookingData.train.number}
              </p>
              <p className="text-gray-600">{bookingData.train.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Class</p>
              <p className="font-semibold">{bookingData.coach}</p>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">From</p>
              <p className="text-xl font-bold">{bookingData.from}</p>
              <p className="text-emerald-600 font-semibold">{bookingData.train.dep}</p>
            </div>
            <div className="text-3xl text-gray-300">→</div>
            <div className="text-right">
              <p className="text-sm text-gray-500">To</p>
              <p className="text-xl font-bold">{bookingData.to}</p>
              <p className="text-emerald-600 font-semibold">{bookingData.train.arr}</p>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">Journey Date</p>
            <p className="font-semibold">
              {new Date(bookingData.date).toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Passengers */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-bold mb-4 text-gray-700">Passengers</h3>
          <div className="space-y-3">
            {bookingData.passengers?.map((p, i) => (
              <div 
                key={i} 
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-gray-500">Age: {p.age}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600">Seat {p.seatNumber}</p>
                  <p className="text-sm text-gray-500">
                    {BERTH_LABELS[p.berthType as BerthType]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fare */}
        <div className="p-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Fare</span>
            <span className="text-2xl font-bold text-emerald-600">
              ₹{bookingData.totalFare}
            </span>
          </div>
          <div className="mt-4 p-3 bg-emerald-50 rounded-lg text-center">
            <p className="text-emerald-700 font-semibold">
              ✓ Booking Confirmed
            </p>
          </div>
        </div>
      </div>

      {/* Email Status */}
      {emailSent && (
        <div className="mt-4 flex items-center gap-2 text-primary animate-fade-in">
          <Mail className="w-5 h-5" />
          <span className="text-sm">Confirmation email sent!</span>
        </div>
      )}

      {/* Download Button */}
      <Button
        onClick={downloadPDF}
        className="mt-6 btn-primary-gradient font-bold py-4 px-8 rounded-xl flex items-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/25"
      >
        <FileText className="w-5 h-5" />
        Download PDF Ticket
      </Button>

      <Button
        variant="outline"
        onClick={() => {
          sessionStorage.clear();
          navigate("/");
        }}
        className="mt-4 border-border text-foreground hover:bg-primary/10 transition-all duration-300"
      >
        Book Another Ticket
      </Button>
    </div>
  );
};

export default Ticket;
