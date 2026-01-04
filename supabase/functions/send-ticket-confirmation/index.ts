import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TicketConfirmationRequest {
  email: string;
  pnr: string;
  trainNumber: string;
  trainName: string;
  from: string;
  to: string;
  date: string;
  coach: string;
  passengers: Array<{
    name: string;
    age: string;
    seatNumber: number;
    berthType: string;
  }>;
  totalFare: number;
}

const BERTH_LABELS: Record<string, string> = {
  lb: "Lower Berth",
  mb: "Middle Berth",
  ub: "Upper Berth",
  sl: "Side Lower",
  su: "Side Upper",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: TicketConfirmationRequest = await req.json();

    if (!data.email || !data.pnr) {
      throw new Error("Email and PNR are required");
    }

    const formattedDate = new Date(data.date).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const passengersHtml = data.passengers
      .map(
        (p, i) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${i + 1}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${p.name}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${p.age}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #10b981; font-weight: 600;">Seat ${p.seatNumber}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${BERTH_LABELS[p.berthType] || p.berthType}</td>
        </tr>
      `
      )
      .join("");

    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "TrainRiser <onboarding@resend.dev>",
        to: [data.email],
        subject: `🎫 Booking Confirmed - PNR: ${data.pnr}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
              .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
              .header { background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; }
              .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
              .success-badge { background-color: #dcfce7; color: #166534; padding: 12px 24px; border-radius: 50px; display: inline-block; margin: 20px 0; font-weight: 600; }
              .pnr-box { background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; padding: 20px; border-radius: 12px; text-align: center; margin: 20px; }
              .pnr-label { font-size: 12px; opacity: 0.8; margin-bottom: 5px; }
              .pnr-number { font-size: 28px; font-weight: bold; letter-spacing: 4px; }
              .section { padding: 20px 30px; }
              .section-title { color: #374151; font-size: 18px; font-weight: 600; margin-bottom: 15px; border-bottom: 2px solid #10b981; padding-bottom: 8px; }
              .train-info { background-color: #f0fdf4; padding: 20px; border-radius: 12px; margin-bottom: 20px; }
              .train-number { color: #10b981; font-size: 24px; font-weight: bold; }
              .train-name { color: #6b7280; margin-top: 5px; }
              .route { display: flex; justify-content: space-between; align-items: center; margin-top: 15px; }
              .station { text-align: center; }
              .station-code { font-size: 20px; font-weight: bold; color: #1f2937; }
              .arrow { font-size: 24px; color: #d1d5db; }
              table { width: 100%; border-collapse: collapse; }
              th { background-color: #f9fafb; padding: 12px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase; }
              .fare-box { background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; padding: 20px; border-radius: 12px; text-align: center; margin: 20px; }
              .fare-amount { font-size: 32px; font-weight: bold; }
              .footer { background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🚂 TrainRiser</h1>
              </div>
              
              <div style="text-align: center; padding: 20px;">
                <div class="success-badge">✓ Booking Confirmed</div>
              </div>
              
              <div class="pnr-box">
                <div class="pnr-label">PNR NUMBER</div>
                <div class="pnr-number">${data.pnr}</div>
              </div>
              
              <div class="section">
                <div class="section-title">Train Details</div>
                <div class="train-info">
                  <div class="train-number">${data.trainNumber}</div>
                  <div class="train-name">${data.trainName}</div>
                  <div style="margin-top: 10px; color: #6b7280;">
                    <strong>Class:</strong> ${data.coach} | <strong>Date:</strong> ${formattedDate}
                  </div>
                  <div class="route">
                    <div class="station">
                      <div class="station-code">${data.from}</div>
                    </div>
                    <div class="arrow">→</div>
                    <div class="station">
                      <div class="station-code">${data.to}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">Passenger Details</div>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Age</th>
                      <th>Seat</th>
                      <th>Berth</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${passengersHtml}
                  </tbody>
                </table>
              </div>
              
              <div class="fare-box">
                <div style="font-size: 14px; opacity: 0.8; margin-bottom: 5px;">Total Fare</div>
                <div class="fare-amount">₹${data.totalFare}</div>
              </div>
              
              <div class="footer">
                <p>Thank you for booking with TrainRiser!</p>
                <p>Please carry a valid ID proof during your journey.</p>
                <p>© ${new Date().getFullYear()} TrainRiser. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const emailData = await emailResponse.json();
    console.log("Ticket confirmation email sent:", emailData);

    // Log email
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from("email_logs").insert({
      email: data.email,
      email_type: "ticket_confirmation",
      subject: `Booking Confirmed - PNR: ${data.pnr}`,
    });

    return new Response(JSON.stringify({ success: true, message: "Confirmation email sent" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-ticket-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
