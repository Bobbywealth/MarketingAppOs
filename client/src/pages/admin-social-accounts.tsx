import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SocialAccountManager } from "@/components/SocialAccountManager";
import { Users } from "lucide-react";

export default function AdminSocialAccounts() {
  const [selectedClient, setSelectedClient] = useState<string>("");
  const { data: clients = [] } = useQuery<any[]>({ queryKey: ["/api/clients"] });

  return (
    <div className="min-h-full gradient-mesh overflow-x-hidden">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold">Social Accounts Management</h1>
          <p className="text-sm text-muted-foreground">Manage client social connections and sync status</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-1 glass-strong border-0 h-fit">
            <CardHeader>
              <CardTitle className="text-lg">Select Client</CardTitle>
              <CardDescription>View accounts for a specific client</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Client</Label>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Stats</h4>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Clients</span>
                    <span className="font-bold">{clients.length}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-3">
            {selectedClient ? (
              <SocialAccountManager clientId={selectedClient} isAdmin={true} />
            ) : (
              <Card className="glass-strong border-0 border-2 border-dashed flex flex-col items-center justify-center py-24 text-center">
                <Users className="w-16 h-16 text-muted-foreground/20 mb-4" />
                <h3 className="text-xl font-semibold text-muted-foreground">No Client Selected</h3>
                <p className="text-muted-foreground mt-1">Select a client from the left to manage their social accounts</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


