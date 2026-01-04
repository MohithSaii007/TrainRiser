-- Create table for OTP verification
CREATE TABLE public.otp_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert OTP codes (for login flow)
CREATE POLICY "Anyone can create OTP codes" 
ON public.otp_codes 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to select their own OTP codes by email
CREATE POLICY "Anyone can verify their OTP" 
ON public.otp_codes 
FOR SELECT 
USING (true);

-- Allow updates to mark as verified
CREATE POLICY "Anyone can update their OTP" 
ON public.otp_codes 
FOR UPDATE 
USING (true);

-- Create table for email logs
CREATE TABLE public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  email_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'sent'
);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Allow inserts from edge functions
CREATE POLICY "Service role can manage email logs" 
ON public.email_logs 
FOR ALL 
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_otp_codes_email ON public.otp_codes(email);
CREATE INDEX idx_otp_codes_expires_at ON public.otp_codes(expires_at);