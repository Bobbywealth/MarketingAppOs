import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, UtensilsCrossed, DollarSign, ShoppingBag, TrendingUp, Calendar, RefreshCw, Sparkles } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ParsedEmailData {
  type: string;
  orderNumber?: string;
  total?: number;
  currency?: string;
  items?: Array<{ name: string; quantity?: number; price?: number }>;
  date?: string;
  vendor?: string;
  status?: string;
  trackingNumber?: string;
  extractedData?: Record<string, any>;
}

export function RestaurantStats() {
  const { toast } = useToast();
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  
  // Fetch recent restaurant order emails
  const { data: emails = [] } = useQuery({
    queryKey: ["/api/emails", "inbox"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/emails?folder=inbox");
      const allEmails = await response.json();
      // Filter for restaurant/order emails
      return allEmails.filter((email: any) => 
        email.subject?.toLowerCase().includes('order') ||
        email.subject?.toLowerCase().includes('restaurant') ||
        email.subject?.toLowerCase().includes('delivery') ||
        email.from?.toLowerCase().includes('ubereats') ||
        email.from?.toLowerCase().includes('doordash') ||
        email.from?.toLowerCase().includes('grubhub')
      );
    },
    enabled: true,
  });

  // Parse selected email
  const parseEmailMutation = useMutation({
    mutationFn: async (emailId: string) => {
      const response = await apiRequest("POST", `/api/emails/${emailId}/parse`, {});
      if (!response.ok) {
        throw new Error("Failed to parse email");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "✅ Email parsed successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to parse email", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const { data: parsedData, isLoading: isParsing } = useQuery<ParsedEmailData>({
    queryKey: ["/api/emails/parsed", selectedEmailId],
    enabled: false, // Don't auto-fetch
  });

  const handleParseEmail = (emailId: string) => {
    setSelectedEmailId(emailId);
    parseEmailMutation.mutate(emailId);
  };

  // Auto-parse the most recent order email
  const latestOrderEmail = emails[0];

  return (
    <Card className="glass-strong">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <UtensilsCrossed className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <CardTitle>Restaurant Order Stats</CardTitle>
              <CardDescription>Extracted from daily order emails</CardDescription>
            </div>
          </div>
          {latestOrderEmail && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleParseEmail(latestOrderEmail.id)}
              disabled={parseEmailMutation.isPending}
            >
              {parseEmailMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Parse Latest Email
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!latestOrderEmail ? (
          <Alert>
            <AlertDescription className="flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4" />
              No restaurant order emails found. Connect your email and sync to see stats.
            </AlertDescription>
          </Alert>
        ) : parseEmailMutation.isPending ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Parsing email with AI...</span>
          </div>
        ) : parseEmailMutation.data ? (
          <div className="space-y-4">
            {/* Order Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {parseEmailMutation.data.total && (
                <Card className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <DollarSign className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Sales</p>
                        <p className="text-2xl font-bold">
                          {parseEmailMutation.data.currency || '$'}
                          {parseEmailMutation.data.total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {parseEmailMutation.data.orderNumber && (
                <Card className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <ShoppingBag className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Order #</p>
                        <p className="text-lg font-semibold">{parseEmailMutation.data.orderNumber}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {parseEmailMutation.data.vendor && (
                <Card className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/10 rounded-lg">
                        <UtensilsCrossed className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Vendor</p>
                        <p className="text-lg font-semibold">{parseEmailMutation.data.vendor}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {parseEmailMutation.data.date && (
                <Card className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-500/10 rounded-lg">
                        <Calendar className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Date</p>
                        <p className="text-sm font-semibold">{parseEmailMutation.data.date}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Items List */}
            {parseEmailMutation.data.items && parseEmailMutation.data.items.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {parseEmailMutation.data.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{item.quantity || 1}x</Badge>
                          <span className="font-medium">{item.name}</span>
                        </div>
                        {item.price && (
                          <span className="text-sm font-semibold">
                            ${item.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status */}
            {parseEmailMutation.data.status && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant="default">{parseEmailMutation.data.status}</Badge>
              </div>
            )}

            {/* Additional Data */}
            {parseEmailMutation.data.extractedData && Object.keys(parseEmailMutation.data.extractedData).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Additional Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(parseEmailMutation.data.extractedData).map(([key, value]) => (
                      <div key={key} className="p-2 bg-muted/50 rounded">
                        <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                        <p className="text-sm font-medium">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Alert>
            <AlertDescription className="flex items-center justify-between">
              <span>Click "Parse Latest Email" to extract order data from your latest restaurant email.</span>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

