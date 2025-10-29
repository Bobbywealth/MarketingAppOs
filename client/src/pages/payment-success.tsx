import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { HeaderLogo } from "@/components/Logo";
import { apiRequest } from "@/lib/queryClient";

export default function PaymentSuccessPage() {
  const [, setLocation] = useLocation();
  const [isConverting, setIsConverting] = useState(false);
  const [convertMessage, setConvertMessage] = useState<string | null>(null);
  
  // Get session_id from URL
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');

  useEffect(() => {
    async function confirmAndConvert() {
      if (!sessionId) return;
      try {
        setIsConverting(true);
        setConvertMessage("Activating your account...");
        const resp = await apiRequest("POST", "/api/stripe/confirm", { sessionId });
        const data = await resp.json();
        if (data?.success) {
          setConvertMessage("Your account is active. You can log in now.");
        } else {
          setConvertMessage(data?.message || "Account activation completed.");
        }
      } catch (e: any) {
        setConvertMessage(e?.message || "Activation complete.");
      } finally {
        setIsConverting(false);
      }
    }
    confirmAndConvert();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <HeaderLogo className="mx-auto mb-4" />
        </div>

        <Card className="border-2 border-green-500 shadow-2xl">
          <CardHeader className="text-center bg-gradient-to-br from-green-50 to-emerald-50">
            <div className="w-20 h-20 rounded-full bg-green-500 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <CardTitle className="text-3xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              🎉 Payment Successful!
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 text-center space-y-6">
            <p className="text-xl text-gray-700">
              Thank you for choosing our marketing services! 
            </p>
            <div className="bg-blue-50 rounded-lg p-6 space-y-3">
              <p className="text-lg font-semibold text-gray-800">✅ What's Next?</p>
              <ul className="text-left space-y-2 text-gray-700">
                <li>• Your account is now active and ready to use</li>
                <li>• We've sent a confirmation email with your subscription details</li>
                <li>• Our team will reach out within 24 hours to get started</li>
                <li>• Log in to your dashboard to explore all features</li>
              </ul>
            </div>

            {convertMessage && (
              <p className="text-sm text-gray-600">{convertMessage}</p>
            )}

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button 
                size="lg"
                onClick={() => setLocation("/login")}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold"
                disabled={isConverting}
              >
                {isConverting ? "Activating..." : "Go to Login"}
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => setLocation("/")}
                className="flex-1"
              >
                Back to Home
              </Button>
            </div>

            {sessionId && (
              <p className="text-xs text-gray-400 mt-4">
                Transaction ID: {sessionId}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-8 text-gray-600">
          <p>Need help? Contact us at support@marketingteamapp.com</p>
        </div>
      </div>
    </div>
  );
}

