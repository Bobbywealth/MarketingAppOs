import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DollarSign, 
  FileText, 
  ExternalLink, 
  History,
  CheckCircle2,
  AlertCircle,
  Plus,
  Receipt
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Link } from "wouter";

export default function AdminPayoutsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchByCreator] = useState("");

  const { data: payouts = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/creators/payouts/all"],
  });

  const filteredPayouts = payouts.filter(p => 
    p.creatorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPaidOut = filteredPayouts.reduce((sum, p) => sum + p.amountCents, 0) / 100;

  return (
    <div className="min-h-full gradient-mesh">
      <div className="p-4 md:p-6 lg:p-8 xl:p-12 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Creator Payouts</h1>
            <p className="text-muted-foreground">Monitor all payments made to content creators.</p>
          </div>
          <div className="flex items-center gap-3">
            <Card className="px-4 py-2 bg-primary text-primary-foreground shadow-sm">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="font-bold">${totalPaidOut.toLocaleString()} Total Paid</span>
              </div>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5" />
              Payout History & Receipts
            </CardTitle>
            <CardDescription>A complete log of all processed creator payments.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="space-y-2 flex-1 max-w-sm">
                <Label>Filter by Creator</Label>
                <Input 
                  placeholder="Creator name..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchByCreator(e.target.value)} 
                />
              </div>
            </div>

            {isLoading ? (
              <div className="py-10 text-center text-muted-foreground">Loading payouts…</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Receipt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayouts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-xs">
                        {format(new Date(p.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Link href={`/creators/${p.creatorId}`} className="hover:underline font-bold text-sm">
                          {p.creatorName}
                        </Link>
                      </TableCell>
                      <TableCell className="font-black text-blue-600">
                        ${(p.amountCents / 100).toFixed(2)}
                      </TableCell>
                      <TableCell className="capitalize text-xs">
                        {p.payoutMethod.replace('_', ' ')}
                      </TableCell>
                      <TableCell className="text-[10px] font-mono text-muted-foreground">
                        {p.transactionId || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-[10px]">
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {p.receiptUrl ? (
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
                            <a href={p.receiptUrl} target="_blank" rel="noopener noreferrer">
                              <Receipt className="w-4 h-4 text-primary" />
                            </a>
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">No receipt</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredPayouts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                        No payouts found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

